from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from config.database import supabase
from uuid import UUID
from security import get_current_user

router = APIRouter()


def _looks_like_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except Exception:
        return False


def _parse_optional_int(value):
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except Exception:
        return None

def _extract_user_id(user: Any) -> str:
    user_id = getattr(user, "id", None)
    if not user_id and isinstance(user, dict):
        user_id = user.get("id") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    if not _looks_like_uuid(user_id):
        raise HTTPException(status_code=400, detail="buyer_id must be a UUID")
    return str(user_id)


def fetch_details(conversation_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not conversation_ids:
        return {}
    details_response = (
        supabase.table("rfq_details")
        .select(
            "rfq_conversation_id,contact_name,contact_email,contact_phone,"
            "clothing_type,quantity,material,color,size_range,deadline,notes,created_at"
        )
        .in_("rfq_conversation_id", conversation_ids)
        .execute()
    )
    return {d["rfq_conversation_id"]: d for d in (details_response.data or [])}


def fetch_manufacturers(manufacturer_ids: List[int]) -> Dict[int, str]:
    if not manufacturer_ids:
        return {}
    manufacturer_response = (
        supabase.table("manufacturers")
        .select("manufacturer_id,name")
        .in_("manufacturer_id", manufacturer_ids)
        .execute()
    )
    return {
        m["manufacturer_id"]: m["name"] for m in (manufacturer_response.data or [])
    }


def _extract_nested_details(value: Any) -> Optional[Dict[str, Any]]:
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        return value[0] if value else None
    return None


def _extract_manufacturer_name(value: Any) -> Optional[str]:
    if isinstance(value, dict):
        return value.get("name")
    if isinstance(value, list) and value and isinstance(value[0], dict):
        return value[0].get("name")
    return None


def _extract_message_text(message: Dict[str, Any]) -> Optional[str]:
    for key in ("message", "content", "text", "body"):
        value = message.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def fetch_last_messages(conversation_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not conversation_ids:
        return {}
    try:
        messages_response = (
            supabase.table("rfq_messages")
            .select("*")
            .in_("rfq_conversation_id", conversation_ids)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        return {}

    latest_by_conversation: Dict[str, Dict[str, Any]] = {}
    for message in (messages_response.data or []):
        conversation_id = message.get("rfq_conversation_id")
        if not conversation_id or conversation_id in latest_by_conversation:
            continue
        latest_by_conversation[conversation_id] = {
            "last_message_preview": _extract_message_text(message),
            "last_message_at": message.get("created_at"),
        }
    return latest_by_conversation


def attach_details(
    conversations: List[Dict[str, Any]],
    details_map: Dict[int, Dict[str, Any]],
    manufacturer_map: Dict[int, str],
    last_message_map: Dict[int, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    for conversation in conversations:
        conversation_id = conversation.get("id")
        detail = details_map.get(conversation_id)
        conversation["manufacturer_name"] = manufacturer_map.get(
            conversation.get("manufacturer_id")
        )
        conversation["details"] = detail
        conversation["details_summary"] = {
            "clothing_type": detail.get("clothing_type") if detail else None,
            "quantity": detail.get("quantity") if detail else None,
            "deadline": detail.get("deadline") if detail else None,
        }
        message_info = last_message_map.get(conversation_id) or {}
        conversation["last_message_preview"] = message_info.get("last_message_preview")
        conversation["last_message_at"] = message_info.get("last_message_at")
    return conversations


def fetch_conversations(
    buyer_id: str,
    limit: int,
    before: Optional[str] = None,
) -> List[Dict[str, Any]]:
    nested_query = (
        supabase.table("rfq_conversations")
        .select(
            "id,buyer_id,manufacturer_id,status,created_at,"
            "rfq_details(*),manufacturers(name)"
        )
        .eq("buyer_id", buyer_id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if before:
        nested_query = nested_query.lt("created_at", before)

    try:
        nested_response = nested_query.execute()
        nested_conversations = nested_response.data or []
        if nested_conversations:
            normalized: List[Dict[str, Any]] = []
            for item in nested_conversations:
                details = _extract_nested_details(item.get("rfq_details"))
                normalized.append(
                    {
                        "id": item.get("id"),
                        "buyer_id": item.get("buyer_id"),
                        "manufacturer_id": item.get("manufacturer_id"),
                        "status": item.get("status"),
                        "created_at": item.get("created_at"),
                        "manufacturer_name": _extract_manufacturer_name(
                            item.get("manufacturers")
                        ),
                        "details": details,
                        "details_summary": {
                            "clothing_type": details.get("clothing_type")
                            if details
                            else None,
                            "quantity": details.get("quantity") if details else None,
                            "deadline": details.get("deadline") if details else None,
                        },
                    }
                )
            return normalized
    except Exception:
        pass

    conversations_query = (
        supabase.table("rfq_conversations")
        .select("id,buyer_id,manufacturer_id,status,created_at")
        .eq("buyer_id", buyer_id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if before:
        conversations_query = conversations_query.lt("created_at", before)

    conversations_response = conversations_query.execute()
    conversations = conversations_response.data or []
    if not conversations:
        return []

    conversation_ids = [c["id"] for c in conversations if c.get("id")]
    details_map = fetch_details(conversation_ids)
    manufacturer_map = fetch_manufacturers(
        list({c["manufacturer_id"] for c in conversations if c.get("manufacturer_id")})
    )

    return attach_details(conversations, details_map, manufacturer_map, {})


@router.post("/submit")
async def submit_rfq(payload: dict, user=Depends(get_current_user)):
    try:
        buyer_id = _extract_user_id(user)

        manufacturer_id = _parse_optional_int(payload.get("manufacturer_id"))
        status = payload.get("status") or "draft"

        contact_name = payload.get("contact_name")
        contact_email = payload.get("contact_email")
        clothing_type = payload.get("clothing_type")
        quantity_raw = payload.get("quantity")

        missing_fields = []
        if not contact_name:
            missing_fields.append("contact_name")
        if not contact_email:
            missing_fields.append("contact_email")
        if not clothing_type:
            missing_fields.append("clothing_type")
        if quantity_raw is None or quantity_raw == "":
            missing_fields.append("quantity")

        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}",
            )

        conversations_response = supabase.table("rfq_conversations").insert({
            "buyer_id": buyer_id,
            "manufacturer_id": manufacturer_id,
            "status": status,
        }).execute()

        if not conversations_response.data:
            print("failed to create RFQ convo")
            raise HTTPException(status_code=500, detail="Failed to create RFQ conversation")

        rfq_conversation_id = (
            conversations_response.data[0].get("id")
            or conversations_response.data[0].get("rfq_conversation_id")
        )
        if not rfq_conversation_id:
            raise HTTPException(status_code=500, detail="RFQ conversation id missing")

        try:
            quantity = int(quantity_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail="Quantity must be a number")
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

        details_payload = {
            "rfq_conversation_id": rfq_conversation_id,
            "contact_name": contact_name,
            "contact_email": contact_email,
            "contact_phone": payload.get("contact_phone") or None,
            "clothing_type": clothing_type,
            "quantity": quantity,
            "material": payload.get("material") or None,
            "color": payload.get("color") or None,
            "size_range": payload.get("size_range") or None,
            "deadline": payload.get("deadline") or None,
            "notes": payload.get("notes") or None,
        }

        details_response = supabase.table("rfq_details").insert(details_payload).execute()
        if details_response.data is None:
            raise HTTPException(status_code=500, detail="Failed to save RFQ details")

        initial_message_parts = [
            "Quote request",
            f"Type: {clothing_type}",
            f"Quantity: {quantity}",
        ]
        if payload.get("deadline"):
            initial_message_parts.append(f"Deadline: {payload.get('deadline')}")
        if payload.get("notes"):
            initial_message_parts.append(f"Notes: {payload.get('notes')}")

        initial_message = ". ".join(initial_message_parts)
        message_response = (
            supabase.table("rfq_messages")
            .insert(
                {
                    "rfq_conversation_id": rfq_conversation_id,
                    "sender_type": "buyer",
                    "source": "web",
                    "body": initial_message,
                }
            )
            .execute()
        )
        if message_response.data is None:
            raise HTTPException(status_code=500, detail="Failed to create initial RFQ message")

        return {
            "rfq_conversation_id": rfq_conversation_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit RFQ: {e}")


@router.get("/conversations")
async def list_rfq_conversations(
    user=Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    before: Optional[str] = Query(default=None),
):
    try:
        buyer_id = _extract_user_id(user)
        conversations = fetch_conversations(buyer_id=buyer_id, limit=limit, before=before)
        if not conversations:
            return {"conversations": []}

        conversation_ids = [c["id"] for c in conversations if c.get("id")]
        details_map = fetch_details(conversation_ids)
        manufacturer_map = fetch_manufacturers(
            list({c["manufacturer_id"] for c in conversations if c.get("manufacturer_id")})
        )
        last_message_map = fetch_last_messages(conversation_ids)
        conversations = attach_details(
            conversations=conversations,
            details_map=details_map,
            manufacturer_map=manufacturer_map,
            last_message_map=last_message_map,
        )
        return {"conversations": conversations}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load RFQs: {e}")


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user=Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    before: Optional[str] = Query(default=None),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
):
    try:
        if not _looks_like_uuid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")

        buyer_id = _extract_user_id(user)
        conversation_response = (
            supabase.table("rfq_conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("buyer_id", buyer_id)
            .limit(1)
            .execute()
        )
        if not (conversation_response.data or []):
            raise HTTPException(status_code=404, detail="Conversation not found")

        query = (
            supabase.table("rfq_messages")
            .select("*")
            .eq("rfq_conversation_id", conversation_id)
            .order("created_at", desc=(order == "desc"))
            .limit(limit)
        )
        if before:
            query = (
                query.lt("created_at", before)
                if order == "desc"
                else query.gt("created_at", before)
            )

        messages_response = query.execute()
        rows = messages_response.data or []
        messages: List[Dict[str, Any]] = []
        for row in rows:
            messages.append(
                {
                    "id": row.get("id"),
                    "rfq_conversation_id": row.get("rfq_conversation_id"),
                    "sender_type": row.get("sender_type"),
                    "source": row.get("source"),
                    "message": _extract_message_text(row),
                    "body": row.get("body"),
                    "created_at": row.get("created_at"),
                }
            )

        next_cursor = None
        if len(rows) == limit:
            next_cursor = rows[-1].get("created_at")

        return {"messages": messages, "next_cursor": next_cursor, "order": order}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load messages: {e}")
