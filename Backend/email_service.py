import os
import requests
from typing import Dict, Optional
from dotenv import load_dotenv
from html import escape

from pathlib import Path
from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape


load_dotenv()
POSTMARK_URL = "https://api.postmarkapp.com/email"
POSTMARK_API_TOKEN = os.getenv("POSTMARK_API_TOKEN")
FROM_EMAIL = os.getenv("FROM_EMAIL")

class EmailSendError(Exception):
    pass

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)

def render_email_html(*, body_html: str) -> str:
    """Render the shared email wrapper template with caller-provided body HTML."""
    try:
        template = env.get_template("emails/base.html")
    except TemplateNotFound as exc:
        raise EmailSendError("Missing template: templates/emails/base.html") from exc
    return template.render(body_html=body_html)


def message_to_html_paragraph(message: str) -> str:
    """Convert plain message text into a safe single-paragraph HTML block."""
    safe = escape(message).replace("\n", "<br/>")
    return (
        '<p style="margin:0; font-family:Arial,Helvetica,sans-serif; '
        'font-size:16px; line-height:1.6; color:#1f2937;">'
        f"{safe}</p>"
    )


def resolve_email_body_html(*, text_body: Optional[str], html_body: Optional[str]) -> str:
    """Pick HTML body input; fallback to wrapping plain text in a styled <p>."""
    if html_body and html_body.strip():
        return html_body
    if text_body and text_body.strip():
        return message_to_html_paragraph(text_body)
    return ""


def send_email(
    to: str,
    subject: str,
    text_body: Optional[str] = None,
    html_body: Optional[str] = None,
    reply_to: Optional[str] = None,
    custom_headers: Optional[Dict[str, str]] = None,
):
    """Send a Postmark email with a shared HTML wrapper + footer template."""
    if not POSTMARK_API_TOKEN:
        raise EmailSendError("POSTMARK_API_TOKEN is not set")

    if not FROM_EMAIL:
        raise EmailSendError("POSTMARK_FROM_EMAIL is not set")

    if not text_body and not html_body:
        raise ValueError("Either text_body or html_body must be provided")

    html = render_email_html(
        body_html=resolve_email_body_html(text_body=text_body, html_body=html_body)
    )
    # change this to be to (for the to email address)
    payload = {
        "From": FROM_EMAIL,
        "To": "jacobdietz2383@gmail.com",
        "Subject": subject,
        "TextBody": text_body,
        "HtmlBody": html,
        "MessageStream": "outbound",  # default transactional stream
    }
    if reply_to and reply_to.strip():
        payload["ReplyTo"] = reply_to.strip()
    if custom_headers:
        payload["Headers"] = [
            {"Name": str(name), "Value": str(value)}
            for name, value in custom_headers.items()
            if str(name).strip() and str(value).strip()
        ]

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
