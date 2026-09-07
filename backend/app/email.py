import requests
from flask import current_app


def send_email(to, subject, html):
    """Send an email via SendGrid's HTTP API. Returns False (and logs a
    warning instead of raising) when SendGrid isn't configured — e.g. in
    local dev without a key set, or in tests — so callers can fire-and-forget
    without every environment needing real email delivery."""
    api_key = current_app.config.get("SENDGRID_API_KEY")
    sender = current_app.config.get("SENDGRID_FROM")
    if not api_key or not sender:
        current_app.logger.warning("SendGrid is not configured; skipping email to %s", to)
        return False

    response = requests.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": sender},
            "subject": subject,
            "content": [{"type": "text/html", "value": html}],
        },
        timeout=10,
    )
    if not response.ok:
        current_app.logger.error("SendGrid email to %s failed: %s %s", to, response.status_code, response.text)
    return response.ok
