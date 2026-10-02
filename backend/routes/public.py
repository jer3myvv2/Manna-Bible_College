"""Public API endpoints: programme data, site info and the two public forms."""
from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from models import (
    Announcement,
    Application,
    ContactMessage,
    Elective,
    Level,
    Module,
    Programme,
    db,
    utcnow,
)
from utils import (
    clean_text,
    get_json_body,
    honeypot_triggered,
    is_valid_email,
    json_error,
    normalise_phone,
    parse_int,
    rate_limit,
    validation_error,
)

bp = Blueprint("public", __name__)


def _levels():
    return Level.query.order_by(Level.level_number).all()


def _programme_query():
    """Programmes with modules and units eager-loaded (avoids N+1 queries)."""
    return Programme.query.options(
        selectinload(Programme.modules).selectinload(Module.units),
        selectinload(Programme.electives),
    )


# ---------------------------------------------------------------------------
# Read-only content
# ---------------------------------------------------------------------------
@bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@bp.get("/info")
def site_info():
    """Contact details, class time and taglines (edited in config.SITE_INFO)."""
    return jsonify(current_app.config["SITE_INFO"])


@bp.get("/programmes")
def list_programmes():
    """Active programmes with module and unit counts. Optional ?category=Theology."""
    query = _programme_query().filter(Programme.is_active.is_(True))
    category = (request.args.get("category") or "").strip()
    if category:
        query = query.filter(func.lower(Programme.category) == category.lower())
    levels = _levels()
    programmes = query.order_by(Programme.id).all()
    return jsonify([programme.to_summary(levels) for programme in programmes])


@bp.get("/programmes/<slug>")
def programme_detail(slug):
    """Full programme detail: modules → units, levels and electives."""
    programme = (
        _programme_query()
        .filter(Programme.slug == slug, Programme.is_active.is_(True))
        .first()
    )
    if programme is None:
        return json_error("Programme not found.", 404)
    return jsonify(programme.to_detail(_levels()))


@bp.get("/levels")
def list_levels():
    return jsonify([level.to_dict() for level in _levels()])


@bp.get("/electives")
def list_electives():
    """All electives / short courses. Optional ?q= search and ?programme=<slug>."""
    query = Elective.query.options(selectinload(Elective.programme))
    search = (request.args.get("q") or "").strip()
    if search:
        query = query.filter(Elective.name.ilike(f"%{search}%"))
    programme_slug = (request.args.get("programme") or "").strip()
    if programme_slug:
        query = query.join(Programme).filter(Programme.slug == programme_slug)
    electives = query.order_by(Elective.order, Elective.id).all()
    return jsonify([elective.to_dict() for elective in electives])


@bp.get("/announcements")
def list_announcements():
    """Published announcements, newest first."""
    announcements = (
        Announcement.query.filter(Announcement.is_published.is_(True))
        .order_by(Announcement.created_at.desc(), Announcement.id.desc())
        .all()
    )
    return jsonify([announcement.to_dict() for announcement in announcements])


# ---------------------------------------------------------------------------
# Forms
# ---------------------------------------------------------------------------
def _next_reference(year):
    """Next sequential reference for the year, e.g. MC-2026-0001."""
    prefix = f"{current_app.config['APPLICATION_REF_PREFIX']}-{year}-"
    last = (
        db.session.query(Application.reference)
        .filter(Application.reference.like(prefix + "%"))
        .order_by(Application.id.desc())
        .first()
    )
    sequence = 1
    if last:
        last_number = parse_int(last[0].rsplit("-", 1)[-1])
        sequence = (last_number or 0) + 1
    return f"{prefix}{sequence:04d}"


@bp.post("/applications")
@rate_limit(limit=5, window=600, scope="applications")
def create_application():
    data, error = get_json_body()
    if error:
        return error
    if honeypot_triggered(data):
        return json_error("Your submission could not be accepted.", 400)

    errors = {}
    full_name = clean_text(data, "full_name", "Full name", errors, min_len=3, max_len=120)
    email = clean_text(data, "email", "Email address", errors, max_len=120)
    if email and "email" not in errors and not is_valid_email(email):
        errors["email"] = "Enter a valid email address, e.g. name@example.com."

    phone_raw = clean_text(data, "phone", "Phone number", errors, max_len=30)
    phone = normalise_phone(phone_raw)
    if phone_raw and "phone" not in errors and phone is None:
        errors["phone"] = (
            "Enter a valid phone number, e.g. 0712 345 678 or +254 712 345 678 "
            "(international numbers must start with + and the country code)."
        )

    country = clean_text(data, "country", "Country", errors, min_len=2, max_len=80)
    county_or_city = clean_text(data, "county_or_city", "County or city", errors, min_len=2, max_len=80)

    programme = None
    programme_id = parse_int(data.get("programme_id"))
    if programme_id is None:
        errors["programme_id"] = "Please choose a programme."
    else:
        programme = db.session.get(Programme, programme_id)
        if programme is None or not programme.is_active:
            errors["programme_id"] = "The selected programme is not available."

    level = parse_int(data.get("level"))
    valid_levels = {lvl.level_number for lvl in _levels()} or {4, 5, 6}
    if level not in valid_levels:
        options = ", ".join(str(n) for n in sorted(valid_levels))
        errors["level"] = f"Please choose a level ({options})."

    highest_education = clean_text(
        data, "highest_education", "Highest level of education", errors, max_len=120
    )
    church = clean_text(
        data, "church_or_organisation", "Church or organisation", errors, required=False, max_len=160
    )
    heard = clean_text(
        data, "how_did_you_hear", "How you heard about us", errors, required=False, max_len=120
    )
    message = clean_text(data, "message", "Message", errors, required=False, max_len=2000)

    if errors:
        return validation_error(errors)

    year = utcnow().year
    for _attempt in range(3):
        application = Application(
            reference=_next_reference(year),
            full_name=full_name,
            email=email.lower(),
            phone=phone,
            country=country,
            county_or_city=county_or_city,
            programme_id=programme.id,
            level=level,
            highest_education=highest_education,
            church_or_organisation=church,
            how_did_you_hear=heard,
            message=message,
            status="New",
        )
        db.session.add(application)
        try:
            db.session.commit()
            break
        except IntegrityError:
            # Another request took the same reference at the same moment; try the next one.
            db.session.rollback()
    else:
        return json_error("We could not save your application. Please try again.", 500)

    return (
        jsonify(
            {
                "message": "Thank you! Your application has been received.",
                "reference": application.reference,
                "programme": programme.title,
                "level": application.level,
            }
        ),
        201,
    )


@bp.post("/contact")
@rate_limit(limit=5, window=600, scope="contact")
def create_contact_message():
    data, error = get_json_body()
    if error:
        return error
    if honeypot_triggered(data):
        return json_error("Your message could not be accepted.", 400)

    errors = {}
    name = clean_text(data, "name", "Name", errors, min_len=2, max_len=120)
    email = clean_text(data, "email", "Email address", errors, max_len=120)
    if email and "email" not in errors and not is_valid_email(email):
        errors["email"] = "Enter a valid email address, e.g. name@example.com."

    phone_raw = clean_text(data, "phone", "Phone number", errors, required=False, max_len=30)
    phone = normalise_phone(phone_raw) if phone_raw else None
    if phone_raw and "phone" not in errors and phone is None:
        errors["phone"] = "Enter a valid phone number, e.g. 0712 345 678 or +254 712 345 678."

    subject = clean_text(data, "subject", "Subject", errors, min_len=3, max_len=200)
    message = clean_text(data, "message", "Message", errors, min_len=10, max_len=3000)

    if errors:
        return validation_error(errors)

    contact = ContactMessage(
        name=name, email=email.lower(), phone=phone, subject=subject, message=message
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({"message": "Thank you! We will get back to you soon.", "id": contact.id}), 201
