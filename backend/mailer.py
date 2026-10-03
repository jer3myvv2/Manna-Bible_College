"""Minimal SMTP email sender (Python standard library only)."""
import smtplib
import ssl
from email.message import EmailMessage

from flask import current_app


def mail_configured():
    return bool(current_app.config.get("MAIL_SERVER"))


def send_email(to, subject, body):
    """Send a plain-text email. Returns True on success; logs the error and returns False on failure."""
    config = current_app.config
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = config["MAIL_FROM"] or config["MAIL_USERNAME"]
    message["To"] = to
    message.set_content(body)

    try:
        context = ssl.create_default_context()
        if config["MAIL_USE_SSL"]:
            server = smtplib.SMTP_SSL(config["MAIL_SERVER"], config["MAIL_PORT"], context=context, timeout=15)
        else:
            server = smtplib.SMTP(config["MAIL_SERVER"], config["MAIL_PORT"], timeout=15)
        with server:
            if config["MAIL_USE_TLS"] and not config["MAIL_USE_SSL"]:
                server.starttls(context=context)
            if config["MAIL_USERNAME"]:
                server.login(config["MAIL_USERNAME"], config["MAIL_PASSWORD"])
            server.send_message(message)
        return True
    except (smtplib.SMTPException, OSError) as error:
        current_app.logger.error("Could not send email to %s: %s", to, error)
        return False
