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
    

@router.post("/submit")
async def submit_rfq(payload: dict):
    try:
        buyer_id = payload.get("buyer_id")
        if not buyer_id:
            raise HTTPException(status_code=401, detail="User not authenticated")
        if not _looks_like_uuid(buyer_id):
            raise HTTPException(status_code=400, detail="buyer_id must be a UUID")

        manufacturer_id = payload.get("manufacturer_id")
        if manufacturer_id and not _looks_like_uuid(manufacturer_id):
            manufacturer_id = None
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
