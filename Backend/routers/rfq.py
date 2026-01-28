from fastapi import APIRouter, HTTPException
from config.database import supabase
from uuid import UUID

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
    

@router.post("/submit")
async def submit_rfq(payload: dict):
    try:
        buyer_id = payload.get("buyer_id")
        if not buyer_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        if not _looks_like_uuid(buyer_id):
            raise HTTPException(status_code=400, detail="buyer_id must be a UUID")

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

        return {
            "success": True,
            "rfq_conversation_id": rfq_conversation_id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit RFQ: {e}")


@router.get("/conversations/{buyer_id}")
async def list_rfq_conversations(buyer_id: str):
    try:
        if not _looks_like_uuid(buyer_id):
            raise HTTPException(status_code=400, detail="buyer_id must be a UUID")

        conversations_response = (
            supabase.table("rfq_conversations")
            .select("id,buyer_id,manufacturer_id,status,created_at")
            .eq("buyer_id", buyer_id)
            .order("created_at", desc=True)
            .execute()
        )
        conversations = conversations_response.data or []
        if not conversations:
            return {"conversations": []}

        conversation_ids = [c["id"] for c in conversations if c.get("id")]
        details_response = (
            supabase.table("rfq_details")
            .select(
                "rfq_conversation_id,contact_name,contact_email,contact_phone,"
                "clothing_type,quantity,material,color,size_range,deadline,notes,created_at"
            )
            .in_("rfq_conversation_id", conversation_ids)
            .execute()
        )
        details_map = {
            d["rfq_conversation_id"]: d for d in (details_response.data or [])
        }

        manufacturer_ids = list(
            {c["manufacturer_id"] for c in conversations if c.get("manufacturer_id")}
        )
        manufacturer_map = {}
        if manufacturer_ids:
            manufacturer_response = (
                supabase.table("manufacturers")
                .select("manufacturer_id,name")
                .in_("manufacturer_id", manufacturer_ids)
                .execute()
            )
            manufacturer_map = {
                m["manufacturer_id"]: m["name"] for m in (manufacturer_response.data or [])
            }

        for conversation in conversations:
            conversation["manufacturer_name"] = manufacturer_map.get(
                conversation.get("manufacturer_id")
            )
            conversation["details"] = details_map.get(conversation.get("id"))

        return {"conversations": conversations}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load RFQs: {e}")
