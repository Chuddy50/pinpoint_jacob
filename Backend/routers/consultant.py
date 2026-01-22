"""
consultant.py

Last Edited: 1/21/2026
Developers: Jacob Nguyen
Description: AI consultant chat endpoint. Relays user messages to Groq API
             for manufacturing advice and guidance
"""

from fastapi import APIRouter, HTTPException
from config.database import groq_client, consultant_prompt, groq_model

router = APIRouter()

@router.post("/chat")
async def consultant_chat(payload: dict):
    """
    Lightweight chat relay to Groq; accepts message history and optional system prompt.
    """

    # makes sure groq client is configured
    if groq_client is None:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # pul the messages and system prompt from the payload
    messages = payload.get("messages") or []
    system_prompt = payload.get("system_prompt") or consultant_prompt

    if not isinstance(messages, list):
        raise HTTPException(status_code=400, detail="messages must be a list")

    # normalize message format into to Groq format
    groq_messages = [{"role": "system", "content": system_prompt}]
    for message in messages:
        role = message.get("role")
        content = message.get("content") or message.get("text")
        # if in wrong format skip 
        if not role or not content:
            continue
        groq_messages.append(
            {
                "role": role if role in {"user", "assistant"} else "user",
                "content": content,
            }
        )

    # call groq chat completion endpoint
    try:
        completion = groq_client.chat.completions.create(
            model=groq_model,
            messages=groq_messages,
            max_tokens=256,
            temperature=0.4,
        )
        # extract the reply from the completion 
        reply = completion.choices[0].message.content
        # return the completion reply
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {e}")