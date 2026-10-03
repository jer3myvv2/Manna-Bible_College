"""Application configuration.

Secrets and deployment-specific values are read from environment variables
(loaded from ``backend/.env`` if present). Institution details that appear on
the website (contact details, class time, taglines) live in ``SITE_INFO`` so
they can be edited in one place and are served to the frontend by
``GET /api/info``.
"""
import os
from datetime import timedelta

from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def _env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


# ---------------------------------------------------------------------------
# Institution details shown on the website. Edit here, not in the React code.
# ---------------------------------------------------------------------------
SITE_INFO = {
    "institutions": ["Manna College", "Manna Bible Institute"],
    "mode": "Virtual Satellite Class",
    "mode_description": (
        "Fully online. Study from any location on your Laptop, Tablet or Smart Phone."
    ),
    "class_time": {
        "start": "8:00PM",
        "end": "9:30PM",
        "display": "8:00PM – 9:30PM",
        "timezone": "East Africa Time (EAT)",
        "timezone_short": "EAT",
    },
    "accreditation": "TVET Accredited",
    "taglines": {
        "hero": "Advance Your Calling with Our Virtual Satellite Class",
        "theology": "Quality Theological Education. Equipping Leaders. Transforming Lives.",
        "psychology": "Quality Education. Equipping Leaders. Transforming Lives.",
        "mission": "Equipping Leaders. Transforming Lives.",
    },
    "phone": "+254 115 254 478",
    "phone_href": "tel:+254115254478",
    "whatsapp": "+254 115 254 478",
    "whatsapp_url": "https://wa.me/254115254478",
    "emails": ["info@mannacollege.ac.ke", "info@mannabibleinstitute.org"],
    "websites": [
        {"label": "www.mannacollege.ac.ke", "url": "https://www.mannacollege.ac.ke"},
        {"label": "www.mannabibleinstitute.org", "url": "https://www.mannabibleinstitute.org"},
    ],
}


class Config:
    """Default configuration (development and production)."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret-key-change-me-in-production")
    JWT_SECRET_KEY = os.environ.get(
        "JWT_SECRET_KEY", "dev-only-jwt-secret-key-change-me-in-production"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get("JWT_EXPIRES_HOURS", "8")))
    JWT_TOKEN_LOCATION = ["headers"]

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "manna.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Comma-separated list of origins allowed to call the API (the Vite dev server by default).
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    # When the React app has been built (npm run build), Flask can serve it too.
    FRONTEND_DIST = os.environ.get(
        "FRONTEND_DIST", os.path.normpath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
    )

    # Set to true when running behind Nginx so request.remote_addr is the real client IP.
    TRUST_PROXY = _env_bool("TRUST_PROXY", False)

    # Basic in-memory rate limiting for the public forms and the admin login.
    RATE_LIMIT_ENABLED = _env_bool("RATE_LIMIT_ENABLED", True)

    # Dashboard charts count days in East Africa Time (UTC+3).
    LOCAL_UTC_OFFSET_HOURS = int(os.environ.get("LOCAL_UTC_OFFSET_HOURS", "3"))

    # Application reference numbers look like MC-2026-0001.
    APPLICATION_REF_PREFIX = os.environ.get("APPLICATION_REF_PREFIX", "MC")

    # Admin password reset. Links point at FRONTEND_URL (never at the request's Host
    # header, so a forged request cannot make the email link to another site).
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    PASSWORD_RESET_MAX_AGE = int(os.environ.get("PASSWORD_RESET_MINUTES", "30")) * 60

    # Outgoing email (SMTP). Without MAIL_SERVER, reset links are written to the
    # server log instead of being emailed, which is handy in development.
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_USE_TLS = _env_bool("MAIL_USE_TLS", True)
    MAIL_USE_SSL = _env_bool("MAIL_USE_SSL", False)
    MAIL_FROM = os.environ.get("MAIL_FROM", "") or MAIL_USERNAME

    SITE_INFO = SITE_INFO


class TestConfig(Config):
    """Configuration used by automated tests: in-memory DB, no rate limiting."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    RATE_LIMIT_ENABLED = False
    MAIL_SERVER = ""
    FRONTEND_URL = "http://localhost:5173"
