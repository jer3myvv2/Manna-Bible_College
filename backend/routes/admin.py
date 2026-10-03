"""Admin API endpoints. Everything except /login requires a valid JWT."""
import csv
import hashlib
import hmac
import io
import re
from datetime import datetime

from flask import Blueprint, Response, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, verify_jwt_in_request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import func, or_
from sqlalchemy.orm import selectinload

from models import (
    APPLICATION_STATUSES,
    PROGRAMME_CATEGORIES,
    AdminUser,
    Announcement,
    Application,
    ContactMessage,
    Elective,
    Level,
    Module,
    Programme,
    Unit,
    db,
    to_roman,
)
from mailer import mail_configured, send_email
from utils import (
    SLUG_RE,
    clean_text,
    csv_safe,
    get_json_body,
    json_error,
    parse_bool,
    parse_int,
    rate_limit,
    slugify,
    validation_error,
)

bp = Blueprint("admin", __name__)


# Endpoints reachable without a token (signing in and recovering a password).
PUBLIC_ENDPOINTS = {
    "admin.login",
    "admin.forgot_password",
    "admin.check_reset_token",
    "admin.reset_password",
}


def password_fingerprint(admin):
    """Short value that changes whenever the admin's password changes.

    Stored in login tokens and reset links so both stop working after a password
    change. It is an HMAC, so it reveals nothing about the password hash.
    """
    key = current_app.config["SECRET_KEY"].encode()
    return hmac.new(key, admin.password_hash.encode(), hashlib.sha256).hexdigest()[:16]


@bp.before_request
def require_admin():
    """Protect every admin endpoint except signing in and password recovery."""
    if request.method == "OPTIONS" or request.endpoint in PUBLIC_ENDPOINTS:
        return None
    verify_jwt_in_request()
    admin_id = parse_int(get_jwt_identity())
    admin = db.session.get(AdminUser, admin_id) if admin_id is not None else None
    if admin is None:
        return json_error("Your session is no longer valid. Please log in again.", 401)
    if get_jwt().get("pwv") != password_fingerprint(admin):
        return json_error("Your password was changed. Please log in again.", 401)
    return None


def _levels():
    return Level.query.order_by(Level.level_number).all()


def _get_or_404(model, object_id, label):
    obj = db.session.get(model, object_id)
    if obj is None:
        return None, json_error(f"{label} not found.", 404)
    return obj, None


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
@bp.post("/login")
@rate_limit(limit=10, window=900, scope="admin-login")
def login():
    data, error = get_json_body()
    if error:
        return error
    username = str(data.get("username") or "").strip()
    password = str(data.get("password") or "")
    if not username or not password:
        return json_error("Username and password are required.", 400)

    admin = AdminUser.query.filter(func.lower(AdminUser.username) == username.lower()).first()
    if admin is None or not admin.check_password(password):
        return json_error("Invalid username or password.", 401)

    token = create_access_token(
        identity=str(admin.id),
        additional_claims={"username": admin.username, "pwv": password_fingerprint(admin)},
    )
    return jsonify({"access_token": token, "admin": admin.to_dict()})


# ---------------------------------------------------------------------------
# Forgot / reset password
# ---------------------------------------------------------------------------
def _reset_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="admin-password-reset")


def make_reset_token(admin):
    return _reset_serializer().dumps({"uid": admin.id, "pwv": password_fingerprint(admin)})


def _admin_from_reset_token(token):
    """Return (admin, None) for a valid reset token, or (None, error_response)."""
    try:
        data = _reset_serializer().loads(token, max_age=current_app.config["PASSWORD_RESET_MAX_AGE"])
    except SignatureExpired:
        return None, json_error("This reset link has expired. Please request a new one.", 400)
    except BadSignature:
        return None, json_error("This reset link is not valid. Please request a new one.", 400)
    admin = db.session.get(AdminUser, parse_int(data.get("uid")) or 0) if isinstance(data, dict) else None
    if admin is None or data.get("pwv") != password_fingerprint(admin):
        # The password has changed since the link was issued, so the link was already used.
        return None, json_error("This reset link has already been used. Please request a new one.", 400)
    return admin, None


def password_problem(password, username):
    """Explain why a new password is too weak, or return None if it is acceptable."""
    if len(password) < 8:
        return "Use at least 8 characters."
    if len(password) > 128:
        return "Use 128 characters or fewer."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Use a mix of letters and numbers."
    if password.lower() == username.lower():
        return "Your password cannot be the same as your username."
    return None


def _send_reset_link(admin):
    minutes = current_app.config["PASSWORD_RESET_MAX_AGE"] // 60
    link = f"{current_app.config['FRONTEND_URL']}/admin/reset-password?token={make_reset_token(admin)}"
    if not mail_configured():
        current_app.logger.warning(
            "Email is not configured. Password reset link for admin '%s' (valid %s minutes): %s",
            admin.username, minutes, link,
        )
        return
    if not admin.email:
        current_app.logger.warning(
            "Password reset requested for admin '%s', but the account has no email address. "
            "Set ADMIN_EMAIL in backend/.env and run seed.py.", admin.username,
        )
        return
    send_email(
        admin.email,
        "Reset your Manna College admin password",
        f"Hello {admin.username},\n\n"
        "We received a request to reset the password for your Manna College & Manna Bible "
        "Institute admin account.\n\n"
        f"Choose a new password here (this link expires in {minutes} minutes and works once):\n"
        f"{link}\n\n"
        "If you did not ask for this, you can ignore this email. Your password will not change.\n",
    )


@bp.post("/forgot-password")
@rate_limit(limit=5, window=900, scope="admin-forgot-password")
def forgot_password():
    """Email a reset link. Always answers the same way so it never reveals which accounts exist."""
    data, error = get_json_body()
    if error:
        return error
    identifier = str(data.get("identifier") or "").strip()
    if not identifier:
        return validation_error({"identifier": "Enter your username or email address."})

    admin = AdminUser.query.filter(
        or_(
            func.lower(AdminUser.username) == identifier.lower(),
            func.lower(AdminUser.email) == identifier.lower(),
        )
    ).first()
    if admin is not None:
        _send_reset_link(admin)

    minutes = current_app.config["PASSWORD_RESET_MAX_AGE"] // 60
    payload = {
        "message": "If that account exists, we have sent a password reset link to its email address. "
        f"The link expires in {minutes} minutes."
    }
    if current_app.debug and not mail_configured():
        payload["dev_note"] = (
            "Email is not set up on this server yet, so the reset link was printed in the "
            "backend (Flask) terminal instead."
        )
    return jsonify(payload)


@bp.post("/reset-password/check")
@rate_limit(limit=30, window=900, scope="admin-reset-check")
def check_reset_token():
    """Let the reset page show "link expired" straight away instead of after typing."""
    data, error = get_json_body()
    if error:
        return error
    admin, error = _admin_from_reset_token(str(data.get("token") or ""))
    if error:
        return error
    return jsonify({"username": admin.username})


@bp.post("/reset-password")
@rate_limit(limit=10, window=900, scope="admin-reset-password")
def reset_password():
    data, error = get_json_body()
    if error:
        return error
    admin, error = _admin_from_reset_token(str(data.get("token") or ""))
    if error:
        return error
    password = str(data.get("password") or "")
    problem = password_problem(password, admin.username)
    if problem:
        return validation_error({"password": problem})
    admin.set_password(password)  # also invalidates this link and any signed-in sessions
    db.session.commit()
    current_app.logger.info("Admin '%s' reset their password.", admin.username)
    return jsonify({"message": "Your password has been changed. You can now sign in with it."})


@bp.get("/me")
def me():
    admin = db.session.get(AdminUser, int(get_jwt_identity()))
    return jsonify(admin.to_dict())


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------
@bp.get("/stats")
def stats():
    by_status = {status: 0 for status in APPLICATION_STATUSES}
    for status, count in (
        db.session.query(Application.status, func.count(Application.id)).group_by(Application.status)
    ):
        by_status[status] = count

    by_level = {str(level.level_number): 0 for level in _levels()}
    for level, count in (
        db.session.query(Application.level, func.count(Application.id)).group_by(Application.level)
    ):
        by_level[str(level)] = count

    programme_rows = {}
    for programme in Programme.query.order_by(Programme.id):
        programme_rows[programme.id] = {
            "programme_id": programme.id,
            "title": programme.title,
            "short_title": programme.short_title,
            "total": 0,
            "by_status": {status: 0 for status in APPLICATION_STATUSES},
        }
    for programme_id, status, count in (
        db.session.query(Application.programme_id, Application.status, func.count(Application.id))
        .group_by(Application.programme_id, Application.status)
    ):
        row = programme_rows.get(programme_id)
        if row:
            row["total"] += count
            row["by_status"][status] = row["by_status"].get(status, 0) + count

    recent = (
        Application.query.options(selectinload(Application.programme))
        .order_by(Application.created_at.desc(), Application.id.desc())
        .limit(5)
        .all()
    )

    return jsonify(
        {
            "totals": {
                "applications": Application.query.count(),
                "new_applications": by_status.get("New", 0),
                "messages": ContactMessage.query.count(),
                "unread_messages": ContactMessage.query.filter_by(is_read=False).count(),
                "programmes": Programme.query.count(),
                "active_programmes": Programme.query.filter_by(is_active=True).count(),
                "electives": Elective.query.count(),
                "announcements": Announcement.query.filter_by(is_published=True).count(),
            },
            "by_status": by_status,
            "by_level": by_level,
            "by_programme": list(programme_rows.values()),
            "recent_applications": [application.to_dict() for application in recent],
        }
    )


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
def _filtered_applications():
    """Applications query filtered by ?programme_id, ?level, ?status and ?q (search)."""
    query = Application.query.options(selectinload(Application.programme))
    programme_id = parse_int(request.args.get("programme_id"))
    if programme_id:
        query = query.filter(Application.programme_id == programme_id)
    level = parse_int(request.args.get("level"))
    if level:
        query = query.filter(Application.level == level)
    status = (request.args.get("status") or "").strip()
    if status:
        query = query.filter(Application.status == status)
    search = (request.args.get("q") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Application.full_name.ilike(like),
                Application.reference.ilike(like),
                Application.email.ilike(like),
                Application.phone.ilike(like),
            )
        )
    return query.order_by(Application.created_at.desc(), Application.id.desc())


@bp.get("/applications")
def list_applications():
    page = max(parse_int(request.args.get("page")) or 1, 1)
    per_page = min(max(parse_int(request.args.get("per_page")) or 25, 1), 200)
    pagination = _filtered_applications().paginate(page=page, per_page=per_page, error_out=False)
    return jsonify(
        {
            "items": [application.to_dict() for application in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": per_page,
            "statuses": list(APPLICATION_STATUSES),
        }
    )


@bp.get("/applications/export")
def export_applications():
    """Download the (filtered) applications as a CSV file."""
    output = io.StringIO()
    output.write("﻿")  # BOM so Excel opens the file as UTF-8
    writer = csv.writer(output)
    writer.writerow(
        [
            "Reference", "Date (UTC)", "Status", "Full name", "Email", "Phone", "Country",
            "County / City", "Programme", "Level", "Highest education",
            "Church / Organisation", "How did you hear", "Message",
        ]
    )
    for app_row in _filtered_applications():
        writer.writerow(
            [
                csv_safe(value)
                for value in (
                    app_row.reference,
                    app_row.created_at.strftime("%Y-%m-%d %H:%M"),
                    app_row.status,
                    app_row.full_name,
                    app_row.email,
                    app_row.phone,
                    app_row.country,
                    app_row.county_or_city,
                    app_row.programme.title if app_row.programme else "",
                    app_row.level,
                    app_row.highest_education,
                    app_row.church_or_organisation,
                    app_row.how_did_you_hear,
                    app_row.message,
                )
            ]
        )
    filename = f"manna-applications-{datetime.now().strftime('%Y%m%d-%H%M')}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@bp.get("/applications/<int:application_id>")
def get_application(application_id):
    application, error = _get_or_404(Application, application_id, "Application")
    if error:
        return error
    return jsonify(application.to_dict())


@bp.patch("/applications/<int:application_id>")
def update_application(application_id):
    application, error = _get_or_404(Application, application_id, "Application")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    status = str(data.get("status") or "").strip()
    if status not in APPLICATION_STATUSES:
        return validation_error({"status": f"Status must be one of: {', '.join(APPLICATION_STATUSES)}."})
    application.status = status
    db.session.commit()
    return jsonify(application.to_dict())


# ---------------------------------------------------------------------------
# Contact messages
# ---------------------------------------------------------------------------
@bp.get("/messages")
def list_messages():
    query = ContactMessage.query
    if parse_bool(request.args.get("unread")):
        query = query.filter_by(is_read=False)
    messages = query.order_by(ContactMessage.created_at.desc(), ContactMessage.id.desc()).all()
    return jsonify([message.to_dict() for message in messages])


@bp.patch("/messages/<int:message_id>")
def update_message(message_id):
    message, error = _get_or_404(ContactMessage, message_id, "Message")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    message.is_read = parse_bool(data.get("is_read", True))
    db.session.commit()
    return jsonify(message.to_dict())


@bp.delete("/messages/<int:message_id>")
def delete_message(message_id):
    message, error = _get_or_404(ContactMessage, message_id, "Message")
    if error:
        return error
    db.session.delete(message)
    db.session.commit()
    return jsonify({"message": "Message deleted."})


# ---------------------------------------------------------------------------
# Programmes
# ---------------------------------------------------------------------------
PROGRAMME_TEXT_FIELDS = {
    # field: (label, required, max_len)
    "title": ("Title", True, 200),
    "short_title": ("Short title", True, 120),
    "tagline": ("Tagline", False, 255),
    "description": ("Description", False, 5000),
    "accreditation_note": ("Accreditation note", False, 255),
    "hero_image": ("Hero image", False, 255),
}


def _apply_programme_fields(programme, data, partial):
    """Validate and copy programme fields from ``data``. Returns an errors dict."""
    errors = {}
    for field, (label, required, max_len) in PROGRAMME_TEXT_FIELDS.items():
        if partial and field not in data:
            continue
        value = clean_text(data, field, label, errors, required=required, max_len=max_len)
        if field not in errors:
            setattr(programme, field, value)

    if not partial or "category" in data:
        category = str(data.get("category") or "").strip()
        if category not in PROGRAMME_CATEGORIES:
            errors["category"] = f"Category must be one of: {', '.join(PROGRAMME_CATEGORIES)}."
        else:
            programme.category = category

    if not partial or "slug" in data:
        # A blank slug is generated from the short title.
        slug = slugify(data.get("slug") or data.get("short_title") or programme.short_title)
        if not slug or not SLUG_RE.match(slug):
            errors["slug"] = "Slug may only contain lowercase letters, numbers and hyphens."
        else:
            clash = Programme.query.filter(Programme.slug == slug, Programme.id != programme.id).first()
            if clash:
                errors["slug"] = "Another programme already uses this slug."
            else:
                programme.slug = slug

    if "is_active" in data:
        programme.is_active = parse_bool(data.get("is_active"))
    return errors


def _programme_admin_dict(programme, levels):
    data = programme.to_summary(levels)
    data["application_count"] = programme.applications.count()
    return data


@bp.get("/programmes")
def admin_list_programmes():
    levels = _levels()
    programmes = (
        Programme.query.options(selectinload(Programme.modules).selectinload(Module.units))
        .order_by(Programme.id)
        .all()
    )
    return jsonify([_programme_admin_dict(programme, levels) for programme in programmes])


@bp.get("/programmes/<int:programme_id>")
def admin_get_programme(programme_id):
    programme, error = _get_or_404(Programme, programme_id, "Programme")
    if error:
        return error
    return jsonify(programme.to_detail(_levels()))


@bp.post("/programmes")
def admin_create_programme():
    data, error = get_json_body()
    if error:
        return error
    programme = Programme(is_active=True)
    errors = _apply_programme_fields(programme, data, partial=False)
    if errors:
        return validation_error(errors)
    db.session.add(programme)
    db.session.commit()
    return jsonify(programme.to_detail(_levels())), 201


@bp.route("/programmes/<int:programme_id>", methods=["PUT", "PATCH"])
def admin_update_programme(programme_id):
    programme, error = _get_or_404(Programme, programme_id, "Programme")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = _apply_programme_fields(programme, data, partial=request.method == "PATCH")
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(programme.to_detail(_levels()))


@bp.delete("/programmes/<int:programme_id>")
def admin_delete_programme(programme_id):
    programme, error = _get_or_404(Programme, programme_id, "Programme")
    if error:
        return error
    application_count = programme.applications.count()
    if application_count:
        return json_error(
            f"This programme has {application_count} application(s) and cannot be deleted. "
            "Mark it as inactive instead to hide it from the website.",
            409,
        )
    db.session.delete(programme)
    db.session.commit()
    return jsonify({"message": "Programme deleted."})


# ---------------------------------------------------------------------------
# Modules
# ---------------------------------------------------------------------------
def _apply_module_fields(module, data, partial):
    errors = {}
    if not partial or "number" in data:
        number = parse_int(data.get("number"))
        if number is None or not 1 <= number <= 12:
            errors["number"] = "Module number must be between 1 and 12."
        else:
            clash = Module.query.filter(
                Module.programme_id == module.programme_id,
                Module.number == number,
                Module.id != module.id,
            ).first()
            if clash:
                errors["number"] = f"Module {to_roman(number)} already exists in this programme."
            else:
                module.number = number
                module.roman = to_roman(number)
    if not partial or "title" in data:
        title = clean_text(data, "title", "Module title", errors, max_len=200)
        if "title" not in errors:
            module.title = title
    return errors


@bp.post("/programmes/<int:programme_id>/modules")
def admin_create_module(programme_id):
    programme, error = _get_or_404(Programme, programme_id, "Programme")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    module = Module(programme_id=programme.id)
    errors = _apply_module_fields(module, data, partial=False)
    if errors:
        return validation_error(errors)
    db.session.add(module)
    db.session.commit()
    return jsonify(module.to_dict()), 201


@bp.route("/modules/<int:module_id>", methods=["PUT", "PATCH"])
def admin_update_module(module_id):
    module, error = _get_or_404(Module, module_id, "Module")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = _apply_module_fields(module, data, partial=request.method == "PATCH")
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(module.to_dict())


@bp.delete("/modules/<int:module_id>")
def admin_delete_module(module_id):
    module, error = _get_or_404(Module, module_id, "Module")
    if error:
        return error
    db.session.delete(module)
    db.session.commit()
    return jsonify({"message": "Module deleted."})


# ---------------------------------------------------------------------------
# Units
# ---------------------------------------------------------------------------
@bp.post("/modules/<int:module_id>/units")
def admin_create_unit(module_id):
    module, error = _get_or_404(Module, module_id, "Module")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = {}
    name = clean_text(data, "name", "Unit name", errors, max_len=200)
    if errors:
        return validation_error(errors)
    order = parse_int(data.get("order"))
    if order is None:
        order = max((unit.order for unit in module.units), default=0) + 1
    unit = Unit(module_id=module.id, name=name, order=order)
    db.session.add(unit)
    db.session.commit()
    return jsonify(unit.to_dict()), 201


@bp.route("/units/<int:unit_id>", methods=["PUT", "PATCH"])
def admin_update_unit(unit_id):
    unit, error = _get_or_404(Unit, unit_id, "Unit")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = {}
    if request.method == "PUT" or "name" in data:
        name = clean_text(data, "name", "Unit name", errors, max_len=200)
        if "name" not in errors:
            unit.name = name
    if "order" in data:
        order = parse_int(data.get("order"))
        if order is None:
            errors["order"] = "Order must be a whole number."
        else:
            unit.order = order
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(unit.to_dict())


@bp.delete("/units/<int:unit_id>")
def admin_delete_unit(unit_id):
    unit, error = _get_or_404(Unit, unit_id, "Unit")
    if error:
        return error
    db.session.delete(unit)
    db.session.commit()
    return jsonify({"message": "Unit deleted."})


# ---------------------------------------------------------------------------
# Electives / short courses
# ---------------------------------------------------------------------------
def _apply_elective_fields(elective, data, partial):
    errors = {}
    if not partial or "name" in data:
        name = clean_text(data, "name", "Elective name", errors, max_len=200)
        if "name" not in errors:
            elective.name = name
    if "programme_id" in data:
        raw = data.get("programme_id")
        if raw in (None, "", 0, "0"):
            elective.programme_id = None
        else:
            programme_id = parse_int(raw)
            if programme_id is None or db.session.get(Programme, programme_id) is None:
                errors["programme_id"] = "Programme not found."
            else:
                elective.programme_id = programme_id
    if "order" in data:
        order = parse_int(data.get("order"))
        if order is None:
            errors["order"] = "Order must be a whole number."
        else:
            elective.order = order
    return errors


@bp.get("/electives")
def admin_list_electives():
    electives = (
        Elective.query.options(selectinload(Elective.programme))
        .order_by(Elective.order, Elective.id)
        .all()
    )
    return jsonify([elective.to_dict() for elective in electives])


@bp.post("/electives")
def admin_create_elective():
    data, error = get_json_body()
    if error:
        return error
    elective = Elective()
    errors = _apply_elective_fields(elective, data, partial=False)
    if errors:
        return validation_error(errors)
    if "order" not in data:
        elective.order = (db.session.query(func.max(Elective.order)).scalar() or 0) + 1
    db.session.add(elective)
    db.session.commit()
    return jsonify(elective.to_dict()), 201


@bp.route("/electives/<int:elective_id>", methods=["PUT", "PATCH"])
def admin_update_elective(elective_id):
    elective, error = _get_or_404(Elective, elective_id, "Elective")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = _apply_elective_fields(elective, data, partial=request.method == "PATCH")
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(elective.to_dict())


@bp.delete("/electives/<int:elective_id>")
def admin_delete_elective(elective_id):
    elective, error = _get_or_404(Elective, elective_id, "Elective")
    if error:
        return error
    db.session.delete(elective)
    db.session.commit()
    return jsonify({"message": "Elective deleted."})


# ---------------------------------------------------------------------------
# Announcements
# ---------------------------------------------------------------------------
def _apply_announcement_fields(announcement, data, partial):
    errors = {}
    if not partial or "title" in data:
        title = clean_text(data, "title", "Title", errors, min_len=3, max_len=200)
        if "title" not in errors:
            announcement.title = title
    if not partial or "body" in data:
        body = clean_text(data, "body", "Body", errors, max_len=5000)
        if "body" not in errors:
            announcement.body = body
    if "is_published" in data:
        announcement.is_published = parse_bool(data.get("is_published"))
    return errors


@bp.get("/announcements")
def admin_list_announcements():
    announcements = Announcement.query.order_by(
        Announcement.created_at.desc(), Announcement.id.desc()
    ).all()
    return jsonify([announcement.to_dict() for announcement in announcements])


@bp.post("/announcements")
def admin_create_announcement():
    data, error = get_json_body()
    if error:
        return error
    announcement = Announcement(is_published=True)
    errors = _apply_announcement_fields(announcement, data, partial=False)
    if errors:
        return validation_error(errors)
    db.session.add(announcement)
    db.session.commit()
    return jsonify(announcement.to_dict()), 201


@bp.route("/announcements/<int:announcement_id>", methods=["PUT", "PATCH"])
def admin_update_announcement(announcement_id):
    announcement, error = _get_or_404(Announcement, announcement_id, "Announcement")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = _apply_announcement_fields(announcement, data, partial=request.method == "PATCH")
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(announcement.to_dict())


@bp.delete("/announcements/<int:announcement_id>")
def admin_delete_announcement(announcement_id):
    announcement, error = _get_or_404(Announcement, announcement_id, "Announcement")
    if error:
        return error
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({"message": "Announcement deleted."})


# ---------------------------------------------------------------------------
# Levels (award names and module requirements are editable)
# ---------------------------------------------------------------------------
@bp.get("/levels")
def admin_list_levels():
    return jsonify([level.to_dict() for level in _levels()])


@bp.route("/levels/<int:level_id>", methods=["PUT", "PATCH"])
def admin_update_level(level_id):
    level, error = _get_or_404(Level, level_id, "Level")
    if error:
        return error
    data, error = get_json_body()
    if error:
        return error
    errors = {}
    partial = request.method == "PATCH"
    if not partial or "award" in data:
        award = clean_text(data, "award", "Award", errors, max_len=50)
        if "award" not in errors:
            level.award = award
    if not partial or "modules_required" in data:
        modules_required = clean_text(data, "modules_required", "Modules required", errors, max_len=100)
        if "modules_required" not in errors:
            level.modules_required = modules_required
    if not partial or "max_module" in data:
        max_module = parse_int(data.get("max_module"))
        if max_module is None or not 1 <= max_module <= 12:
            errors["max_module"] = "Highest module must be between 1 and 12."
        else:
            level.max_module = max_module
    if errors:
        db.session.rollback()
        return validation_error(errors)
    db.session.commit()
    return jsonify(level.to_dict())

