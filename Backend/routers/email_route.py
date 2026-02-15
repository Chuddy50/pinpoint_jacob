from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from config.database import supabase
from security import get_current_user

router = APIRouter()
ALLOWED_SOURCES = {"web", "email", "external"}


def _looks_like_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except Exception:
        return False


def _extract_user_id(user: Any) -> str:
    user_id = getattr(user, "id", None)
    if not user_id and isinstance(user, dict):
        user_id = user.get("id") or user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")
    if not _looks_like_uuid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    return str(user_id)


def _extract_message_text(message: Dict[str, Any]) -> Optional[str]:
    for key in ("message", "content", "text", "body"):
        value = message.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def _assert_conversation_belongs_to_user(conversation_id: str, user_id: str) -> None:
    convo_response = (
        supabase.table("rfq_conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("buyer_id", user_id)
        .limit(1)
        .execute()
    )
    if not (convo_response.data or []):
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.get("/conversations")
async def list_email_conversations(
    user=Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    before: Optional[str] = Query(default=None),
):
    try:
        buyer_id = _extract_user_id(user)

        query = (
            supabase.table("rfq_conversations")
            .select(
                "id,buyer_id,manufacturer_id,status,created_at,"
                "rfq_details(clothing_type,quantity,deadline),manufacturers(name)"
            )
            .eq("buyer_id", buyer_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if before:
            query = query.lt("created_at", before)

        conversations = query.execute().data or []
        if not conversations:
            return {"conversations": []}

        conversation_ids = [c.get("id") for c in conversations if c.get("id")]
        messages_response = (
            supabase.table("rfq_messages")
            .select("rfq_conversation_id,body,created_at")
            .in_("rfq_conversation_id", conversation_ids)
            .order("created_at", desc=True)
            .execute()
        )
        last_message_map: Dict[str, Dict[str, Any]] = {}
        for row in (messages_response.data or []):
            convo_id = row.get("rfq_conversation_id")
            if convo_id and convo_id not in last_message_map:
                last_message_map[convo_id] = row

        normalized: List[Dict[str, Any]] = []
        for row in conversations:
            details = row.get("rfq_details")
            if isinstance(details, list):
                details = details[0] if details else None

            manufacturer = row.get("manufacturers")
            manufacturer_name = None
            if isinstance(manufacturer, dict):
                manufacturer_name = manufacturer.get("name")
            elif isinstance(manufacturer, list) and manufacturer and isinstance(manufacturer[0], dict):
                manufacturer_name = manufacturer[0].get("name")

            last_msg = last_message_map.get(row.get("id"), {})
            normalized.append(
                {
                    "id": row.get("id"),
                    "buyer_id": row.get("buyer_id"),
                    "manufacturer_id": row.get("manufacturer_id"),
                    "manufacturer_name": manufacturer_name,
                    "status": row.get("status"),
                    "created_at": row.get("created_at"),
                    "details_summary": {
                        "clothing_type": details.get("clothing_type") if details else None,
                        "quantity": details.get("quantity") if details else None,
                        "deadline": details.get("deadline") if details else None,
                    },
                    "last_message_preview": _extract_message_text(last_msg),
                    "last_message_at": last_msg.get("created_at"),
                }
            )

        return {"conversations": normalized}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load conversations: {e}")


@router.get("/conversations/{conversation_id}/messages")
async def list_conversation_messages(
    conversation_id: str,
    user=Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    before: Optional[str] = Query(default=None),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
):
    try:
        if not _looks_like_uuid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")

        user_id = _extract_user_id(user)
        _assert_conversation_belongs_to_user(conversation_id, user_id)

        query = (
            supabase.table("rfq_messages")
            .select("id,rfq_conversation_id,sender_type,source,body,created_at")
            .eq("rfq_conversation_id", conversation_id)
            .order("created_at", desc=(order == "desc"))
            .limit(limit)
        )
        if before:
            query = query.lt("created_at", before) if order == "desc" else query.gt("created_at", before)

        rows = query.execute().data or []
        next_cursor = rows[-1].get("created_at") if len(rows) == limit else None

        return {
            "messages": rows,
            "next_cursor": next_cursor,
            "order": order,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load messages: {e}")


@router.post("/conversations/{conversation_id}/messages")
async def create_conversation_message(
    conversation_id: str,
    payload: dict,
    user=Depends(get_current_user),
):
    try:
        if not _looks_like_uuid(conversation_id):
            raise HTTPException(status_code=400, detail="Invalid conversation id")

        body = (payload.get("body") or payload.get("message") or "").strip()
        if not body:
            raise HTTPException(status_code=400, detail="Message body is required")

        user_id = _extract_user_id(user)
        _assert_conversation_belongs_to_user(conversation_id, user_id)

        sender_type = payload.get("sender_type") or "buyer"
        source = payload.get("source") or "web"
        if source not in ALLOWED_SOURCES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source '{source}'. Allowed: {sorted(ALLOWED_SOURCES)}",
            )
        insert_payload = {
            "rfq_conversation_id": conversation_id,
            "sender_type": sender_type,
            "source": source,
            "body": body,
        }

        insert_response = supabase.table("rfq_messages").insert(insert_payload).execute()
        inserted = (insert_response.data or [None])[0]
        if not inserted:
            raise HTTPException(status_code=500, detail="Failed to create message")

        return {"message": inserted}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {e}")
