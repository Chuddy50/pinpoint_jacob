import os
import requests
from typing import Optional
from dotenv import load_dotenv
load_dotenv()
POSTMARK_URL = "https://api.postmarkapp.com/email"
POSTMARK_API_TOKEN = os.getenv("POSTMARK_API_TOKEN")
FROM_EMAIL = os.getenv("FROM_EMAIL")


class EmailSendError(Exception):
    pass


def send_email(
    to: str,
    subject: str,
    text_body: Optional[str] = None,
    html_body: Optional[str] = None,
):
    if not POSTMARK_API_TOKEN:
        raise EmailSendError("POSTMARK_API_TOKEN is not set")

    if not FROM_EMAIL:
        raise EmailSendError("POSTMARK_FROM_EMAIL is not set")

    if not text_body and not html_body:
        raise ValueError("Either text_body or html_body must be provided")

    payload = {
        "From": FROM_EMAIL,
        "To": to,
        "Subject": subject,
        "TextBody": text_body,
        "HtmlBody": html_body,
        "MessageStream": "outbound",  # default transactional stream
    }

    headers = {
        "X-Postmark-Server-Token": POSTMARK_API_TOKEN,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    response = requests.post(
        POSTMARK_URL,
        json=payload,
        headers=headers,
        timeout=10,
    )

    if response.status_code != 200:
        raise EmailSendError(
            f"Postmark error {response.status_code}: {response.text}"
        )

    return response.json()


# send_email(
#     "u1354615@umail.utah.edu", 
#     "Test subject", 
#     "Hello this is a test email", 
# )