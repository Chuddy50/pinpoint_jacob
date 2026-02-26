import os
import re
from html import unescape
from typing import Any, Dict, List, Optional
from uuid import UUID
from email_service import EmailSendError, send_email
from fastapi import APIRouter, Depends, HTTPException, Query,  Request


from config.database import supabase
from security import get_current_user

router = APIRouter()
ALLOWED_SOURCES = {"web", "email", "external"}
UUID_PATTERN = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)
RFQ_SUBJECT_PATTERN = re.compile(
    r"\[rfq:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\]",
    re.IGNORECASE,
)
POSTMARK_INBOUND_DOMAIN = os.getenv("POSTMARK_INBOUND_DOMAIN")
POSTMARK_INBOUND_LOCAL_PART = os.getenv(
    "POSTMARK_INBOUND_LOCAL_PART",
    "a0a2253b87dcade08b46aee2cf0e116e",
)


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


def _extract_sender_email(payload: Dict[str, Any]) -> Optional[str]:
    from_full = payload.get("FromFull")
    if isinstance(from_full, dict):
        sender = from_full.get("Email")
        if isinstance(sender, str) and sender.strip():
            return sender.strip().lower()
    sender = payload.get("From")
    if isinstance(sender, str) and sender.strip():
        if "<" in sender and ">" in sender:
            sender = sender.split("<", 1)[1].split(">", 1)[0]
        return sender.strip().lower()
    return None


def _extract_inbound_body(payload: Dict[str, Any]) -> str:
    def _html_to_text(raw: str) -> str:
        text = re.sub(r"<br\s*/?>", "\n", raw, flags=re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = unescape(text)
        return re.sub(r"\s+", " ", text).strip()

    candidates: List[str] = []

    stripped_reply = payload.get("StrippedTextReply")
    if isinstance(stripped_reply, str) and stripped_reply.strip():
        candidates.append(stripped_reply.strip())

    text_body = payload.get("TextBody")
    if isinstance(text_body, str) and text_body.strip():
        candidates.append(text_body.strip())

    stripped_html = payload.get("StrippedHtmlBody")
    if isinstance(stripped_html, str) and stripped_html.strip():
        parsed = _html_to_text(stripped_html)
        if parsed:
            candidates.append(parsed)

    html_body = payload.get("HtmlBody")
    if isinstance(html_body, str) and html_body.strip():
        parsed = _html_to_text(html_body)
        if parsed:
            candidates.append(parsed)

    if not candidates:
        return ""

    # Prefer the richest content; avoid accidental subject-only stubs.
    candidates.sort(key=lambda value: len(value), reverse=True)
    return candidates[0]


def _extract_uuid_from_text(value: str) -> Optional[str]:
    if not isinstance(value, str) or not value:
        return None
    match = UUID_PATTERN.search(value)
    if not match:
        return None
    candidate = match.group(0)
    return candidate if _looks_like_uuid(candidate) else None


def _extract_conversation_id_from_recipient(value: str) -> Optional[str]:
    if not isinstance(value, str) or "@" not in value:
        return None
    local_part = value.split("@", 1)[0].strip().lower()
    local_part = re.sub(r"^.*<", "", local_part).strip(">")
    if _looks_like_uuid(local_part):
        return local_part
    if local_part.startswith("rfq-"):
        candidate = local_part[4:]
        if _looks_like_uuid(candidate):
            return candidate
    if "+" in local_part:
        suffix = local_part.rsplit("+", 1)[-1]
        if _looks_like_uuid(suffix):
            return suffix
    return None


def _extract_conversation_id_from_payload(payload: Dict[str, Any]) -> Optional[str]:
    mailbox_hash = payload.get("MailboxHash")
    if isinstance(mailbox_hash, str) and _looks_like_uuid(mailbox_hash):
        return mailbox_hash

    to_full = payload.get("ToFull")
    if isinstance(to_full, list):
        for recipient in to_full:
            if not isinstance(recipient, dict):
                continue
            recipient_hash = recipient.get("MailboxHash")
            if isinstance(recipient_hash, str) and _looks_like_uuid(recipient_hash):
                return recipient_hash
            for key in ("Email",):
                raw = recipient.get(key)
                if isinstance(raw, str):
                    parsed = _extract_conversation_id_from_recipient(raw)
                    if parsed:
                        return parsed

    for key in ("OriginalRecipient", "To"):
        raw = payload.get(key)
        if isinstance(raw, str):
            parsed = _extract_conversation_id_from_recipient(raw)
            if parsed:
                return parsed

    headers = payload.get("Headers")
    if isinstance(headers, list):
        for header in headers:
            if not isinstance(header, dict):
                continue
            name = str(header.get("Name") or "").strip().lower()
            value = str(header.get("Value") or "").strip()
            if name in {"x-conversation-id", "x-rfq-conversation-id"}:
                if _looks_like_uuid(value):
                    return value

    subject = payload.get("Subject")
    if isinstance(subject, str):
        match = RFQ_SUBJECT_PATTERN.search(subject)
        if match:
            candidate = match.group(1)
            if _looks_like_uuid(candidate):
                return candidate

    return None


def _find_latest_conversation_for_manufacturer(sender_email: str) -> Optional[str]:
    if not sender_email:
        return None
    manufacturer_response = (
        supabase.table("manufacturers")
        .select("manufacturer_id")
        .ilike("email", sender_email)
        .limit(1)
        .execute()
    )
    manufacturer = (manufacturer_response.data or [None])[0]
    if not manufacturer:
        return None

    manufacturer_id = manufacturer.get("manufacturer_id")
    if not manufacturer_id:
        return None

    conversation_response = (
        supabase.table("rfq_conversations")
        .select("id")
        .eq("manufacturer_id", manufacturer_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    conversation = (conversation_response.data or [None])[0]
    return conversation.get("id") if conversation else None


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


def _get_conversation_context(conversation_id: str, user_id: str) -> Dict[str, Any]:
    convo_response = (
        supabase.table("rfq_conversations")
        .select("id,buyer_id,manufacturer_id")
        .eq("id", conversation_id)
        .eq("buyer_id", user_id)
        .limit(1)
        .execute()
    )
    convo = (convo_response.data or [None])[0]
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    manufacturer = None
    manufacturer_id = convo.get("manufacturer_id")
    if manufacturer_id:
        manufacturer_response = (
            supabase.table("manufacturers")
            .select("manufacturer_id,name,email,contactee,phone")
            .eq("manufacturer_id", manufacturer_id)
            .limit(1)
            .execute()
        )
        manufacturer = (manufacturer_response.data or [None])[0]

    return {
        "conversation_id": convo.get("id"),
        "manufacturer_id": manufacturer_id,
        "manufacturer": manufacturer,
    }


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
        manufacturer_ids = list(
            {c.get("manufacturer_id") for c in conversations if c.get("manufacturer_id")}
        )

        messages_response = (
            supabase.table("rfq_messages")
            .select("rfq_conversation_id,body,created_at")
            .in_("rfq_conversation_id", conversation_ids)
            .order("created_at", desc=True)
            .execute()
        )

        manufacturer_map: Dict[int, str] = {}
        if manufacturer_ids:
            manufacturer_response = (
                supabase.table("manufacturers")
                .select("manufacturer_id,name")
                .in_("manufacturer_id", manufacturer_ids)
                .execute()
            )
            manufacturer_map = {
                row.get("manufacturer_id"): row.get("name")
                for row in (manufacturer_response.data or [])
            }

        last_message_map: Dict[str, Dict[str, Any]] = {}
        first_message_map: Dict[str, Dict[str, Any]] = {}
        for row in (messages_response.data or []):
            convo_id = row.get("rfq_conversation_id")
            if not convo_id:
                continue
            if convo_id not in last_message_map:
                last_message_map[convo_id] = row
            # Rows are descending; last assignment becomes oldest/first message.
            first_message_map[convo_id] = row

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
            if not manufacturer_name:
                manufacturer_name = manufacturer_map.get(row.get("manufacturer_id"))

            conversation_id = row.get("id")
            last_msg = last_message_map.get(conversation_id, {})
            first_msg = first_message_map.get(conversation_id, {})
            normalized.append(
                {
                    "conversation_id": conversation_id,
                    "id": row.get("id"),
                    "buyer_id": row.get("buyer_id"),
                    "manufacturer_id": row.get("manufacturer_id"),
                    "manufacturer_name": manufacturer_name,
                    "status": row.get("status"),
                    "created_at": row.get("created_at"),
                    "preview_text": _extract_message_text(first_msg),
                    "last_message_at": last_msg.get("created_at") or row.get("created_at"),
                    "details_summary": {
                        "clothing_type": details.get("clothing_type") if details else None,
                        "quantity": details.get("quantity") if details else None,
                        "deadline": details.get("deadline") if details else None,
                    },
                    "last_message_preview": _extract_message_text(last_msg),
                }
            )

        normalized.sort(
            key=lambda x: x.get("last_message_at") or x.get("created_at") or "",
            reverse=True,
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
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
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
        context = _get_conversation_context(conversation_id, user_id)
        manufacturer_email = (context.get("manufacturer") or {}).get("email")

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
        # This route is the send-message path; it persists the RFQ message and
        # triggers templated outbound email (base template + footer) when an
        # manufacturer email exists for the conversation.
        if manufacturer_email:
            try:
                reply_to = None
                if POSTMARK_INBOUND_DOMAIN:
                    reply_to = (
                        f"{POSTMARK_INBOUND_LOCAL_PART}+{conversation_id}"
                        f"@{POSTMARK_INBOUND_DOMAIN}"
                    )
                # send_email(
                #     to=manufacturer_email,
                #     subject=f"PinPoint Messaging Service [rfq:{conversation_id}]",
                #     text_body=body,
                #     reply_to=reply_to,
                #     custom_headers={"X-RFQ-Conversation-ID": conversation_id},
                # )
                send_email(
                    to="jacobdietz2383@gmail.com",
                    subject=f"PinPoint Messaging Service [rfq:{conversation_id}]",
                    text_body=body,
                    reply_to=reply_to,
                    custom_headers={"X-RFQ-Conversation-ID": conversation_id},
                )
            except EmailSendError as email_error:
                # Do not fail message persistence if outbound email fails.
                print(f"Email send failed for conversation {conversation_id}: {email_error}")

        if not inserted:
            raise HTTPException(status_code=500, detail="Failed to create message")

        return {
            "message": inserted,
            "conversation_id": context.get("conversation_id"),
            "manufacturer_id": context.get("manufacturer_id"),
            "manufacturer": context.get("manufacturer"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {e}")



@router.post("/webhooks/postmark/inbound")
@router.post("/webhooks/postmark/inbound/")
async def postmark_inbound(request: Request):
    try:
        payload = await request.json()

        body = _extract_inbound_body(payload)
        if not body:
            raise HTTPException(status_code=400, detail="Inbound email body is empty")

        conversation_id = _extract_conversation_id_from_payload(payload)
        sender_email = _extract_sender_email(payload)

        if not conversation_id and sender_email:
            conversation_id = _find_latest_conversation_for_manufacturer(sender_email)

        if not conversation_id or not _looks_like_uuid(conversation_id):
            raise HTTPException(
                status_code=400,
                detail="Could not determine rfq_conversation_id from inbound email",
            )

        conversation_response = (
            supabase.table("rfq_conversations")
            .select("id")
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )
        if not (conversation_response.data or []):
            raise HTTPException(
                status_code=404,
                detail=f"Conversation not found for rfq_conversation_id={conversation_id}",
            )

        insert_response = (
            supabase.table("rfq_messages")
            .insert(
                {
                    "rfq_conversation_id": conversation_id,
                    "sender_type": "manufacturer",
                    "source": "email",
                    "body": body,
                }
            )
            .execute()
        )
        inserted = (insert_response.data or [None])[0]
        if not inserted:
            raise HTTPException(status_code=500, detail="Failed to store inbound email")

        return {"ok": True, "conversation_id": conversation_id, "message_id": inserted.get("id")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process inbound email: {e}")
