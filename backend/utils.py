"""Shared helpers: JSON errors, input validation, spam protection and rate limiting."""
import re
import threading
import time
from collections import defaultdict, deque
from functools import wraps

from flask import current_app, jsonify, request

EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$")
# Kenyan mobile numbers: 07XXXXXXXX / 01XXXXXXXX, optionally written as 2547... or +2547...
KENYAN_PHONE_RE = re.compile(r"^(?:\+?254|0)([17]\d{8})$")
# Any other country in international (E.164) format, e.g. +256 7XX XXX XXX.
INTL_PHONE_RE = re.compile(r"^\+[1-9]\d{7,14}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# Hidden form field that real visitors never see or fill in. Bots usually do.
HONEYPOT_FIELD = "website"


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
def json_error(message, status=400, **extra):
    """Return the API's standard error shape: {"error": "...", ...extra}."""
    payload = {"error": message}
    payload.update(extra)
    return jsonify(payload), status


def validation_error(errors):
    """400 response listing the invalid fields."""
    return json_error("Please correct the highlighted fields.", 400, fields=errors)


def get_json_body():
    """Return (data, None) for a JSON object body, or (None, error_response)."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, json_error("Request body must be a JSON object.", 400)
    return data, None


def honeypot_triggered(data):
    return bool(str(data.get(HONEYPOT_FIELD) or "").strip())


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def clean_text(data, key, label, errors, required=True, min_len=1, max_len=255):
    """Read a string field, trim it and record an error message if it is invalid.

    Returns the cleaned value, or None when an optional field is empty.
    """
    raw = data.get(key)
    value = "" if raw is None else str(raw).strip()
    if not value:
        if required:
            errors[key] = f"{label} is required."
        return None
    if len(value) < min_len:
        errors[key] = f"{label} must be at least {min_len} characters."
    elif len(value) > max_len:
        errors[key] = f"{label} must be {max_len} characters or fewer."
    return value


def is_valid_email(value):
    return bool(value) and len(value) <= 120 and bool(EMAIL_RE.match(value))


def normalise_phone(raw):
    """Strip spaces and punctuation, convert a leading 00 to +, and rewrite Kenyan
    numbers to +254 format. Returns None if the number is not valid."""
    if not raw:
        return None
    phone = re.sub(r"[\s\-().]", "", str(raw))
    if phone.startswith("00"):
        phone = "+" + phone[2:]
    kenyan = KENYAN_PHONE_RE.match(phone)
    if kenyan:
        return "+254" + kenyan.group(1)
    if INTL_PHONE_RE.match(phone):
        return phone
    return None


def parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def slugify(text):
    text = re.sub(r"[^a-zA-Z0-9]+", "-", str(text or "")).strip("-").lower()
    return re.sub(r"-{2,}", "-", text)


def csv_safe(value):
    """Protect exported CSV cells against spreadsheet formula injection.

    Cells starting with = + - @ are prefixed with an apostrophe, except for plain
    phone numbers such as +254115254478.
    """
    if value is None:
        return ""
    text = str(value)
    if text and text[0] in "=+-@\t\r":
        if not re.fullmatch(r"[+-][\d\s()-]+", text):
            return "'" + text
    return text


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------
class RateLimiter:
    """Small in-memory sliding-window rate limiter keyed by client IP and scope.

    This is enough for a single-server deployment. Each Gunicorn worker keeps
    its own counters, so use Flask-Limiter with Redis if you scale out.
    """

    def __init__(self):
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key, limit, window):
        """Record a request. Returns (allowed, seconds_until_retry)."""
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > 10_000:
                self._prune(now, window)
            hits = self._hits[key]
            while hits and now - hits[0] > window:
                hits.popleft()
            if len(hits) >= limit:
                return False, max(1, int(window - (now - hits[0])) + 1)
            hits.append(now)
            return True, 0

    def reset(self):
        with self._lock:
            self._hits.clear()

    def _prune(self, now, window):
        for key in list(self._hits):
            hits = self._hits[key]
            if not hits or now - hits[-1] > window:
                del self._hits[key]


limiter = RateLimiter()


def rate_limit(limit, window, scope):
    """Decorator: allow at most ``limit`` requests per ``window`` seconds per IP."""

    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if current_app.config.get("RATE_LIMIT_ENABLED", True):
                key = f"{scope}:{request.remote_addr or 'unknown'}"
                allowed, retry_after = limiter.hit(key, limit, window)
                if not allowed:
                    response, status = json_error(
                        "Too many requests. Please wait a few minutes and try again.", 429
                    )
                    response.headers["Retry-After"] = str(retry_after)
                    return response, status
            return view(*args, **kwargs)

        return wrapper

    return decorator
