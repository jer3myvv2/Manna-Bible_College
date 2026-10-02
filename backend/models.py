"""SQLAlchemy models for the Manna College & Manna Bible Institute website."""
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()

APPLICATION_STATUSES = ("New", "Contacted", "Admitted", "Rejected")
PROGRAMME_CATEGORIES = ("Theology", "Psychology")


def utcnow():
    """Current UTC time as a naive datetime (SQLite stores no timezone)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(value):
    """Serialise a naive-UTC datetime as an ISO 8601 string with a Z suffix."""
    return value.isoformat(timespec="seconds") + "Z" if value else None


def to_roman(number):
    """Convert a positive integer to Roman numerals (module numbers I–VI and beyond)."""
    numerals = [
        (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"),
        (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
    ]
    result = []
    for value, letters in numerals:
        while number >= value:
            result.append(letters)
            number -= value
    return "".join(result)


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
    """SQLite ignores FOREIGN KEY constraints unless this pragma is set per connection."""
    if type(dbapi_connection).__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def level_labels(levels):
    """Build the display labels used on the posters, e.g.
    ("Certificate | Diploma", "Level 4, 5 & 6")."""
    levels = sorted(levels, key=lambda lvl: lvl.level_number)
    awards = []
    for lvl in levels:
        if lvl.award not in awards:
            awards.append(lvl.award)
    numbers = [str(lvl.level_number) for lvl in levels]
    if not numbers:
        return "", ""
    if len(numbers) == 1:
        level_text = f"Level {numbers[0]}"
    else:
        level_text = f"Level {', '.join(numbers[:-1])} & {numbers[-1]}"
    return " | ".join(awards), level_text


class Programme(db.Model):
    __tablename__ = "programmes"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    short_title = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), nullable=False, default="Theology")
    tagline = db.Column(db.String(255))
    description = db.Column(db.Text)
    accreditation_note = db.Column(db.String(255))
    hero_image = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    modules = db.relationship(
        "Module",
        back_populates="programme",
        cascade="all, delete-orphan",
        order_by="Module.number",
    )
    electives = db.relationship("Elective", back_populates="programme", order_by="Elective.order")
    applications = db.relationship("Application", back_populates="programme", lazy="dynamic")

    @property
    def unit_count(self):
        return sum(len(module.units) for module in self.modules)

    def to_summary(self, levels):
        award_label, level_label = level_labels(levels)
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "short_title": self.short_title,
            "category": self.category,
            "tagline": self.tagline,
            "description": self.description,
            "accreditation_note": self.accreditation_note,
            "hero_image": self.hero_image,
            "is_active": self.is_active,
            "module_count": len(self.modules),
            "unit_count": self.unit_count,
            "elective_count": len(self.electives),
            "award_label": award_label,
            "level_label": level_label,
            "created_at": iso(self.created_at),
        }

    def to_detail(self, levels):
        data = self.to_summary(levels)
        data["modules"] = [module.to_dict() for module in self.modules]
        data["levels"] = [level.to_dict() for level in sorted(levels, key=lambda l: l.level_number)]
        data["electives"] = [elective.to_dict() for elective in self.electives]
        return data


class Module(db.Model):
    __tablename__ = "modules"
    __table_args__ = (
        db.UniqueConstraint("programme_id", "number", name="uq_module_programme_number"),
    )

    id = db.Column(db.Integer, primary_key=True)
    programme_id = db.Column(
        db.Integer, db.ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    number = db.Column(db.Integer, nullable=False)
    roman = db.Column(db.String(10), nullable=False)
    title = db.Column(db.String(200), nullable=False)

    programme = db.relationship("Programme", back_populates="modules")
    units = db.relationship(
        "Unit", back_populates="module", cascade="all, delete-orphan", order_by="Unit.order"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "programme_id": self.programme_id,
            "number": self.number,
            "roman": self.roman,
            "title": self.title,
            "units": [unit.to_dict() for unit in self.units],
        }


class Unit(db.Model):
    __tablename__ = "units"

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(
        db.Integer, db.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(200), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)

    module = db.relationship("Module", back_populates="units")

    def to_dict(self):
        return {"id": self.id, "module_id": self.module_id, "name": self.name, "order": self.order}


class Level(db.Model):
    """Level progression rows (shared by all programmes). Editable from the admin."""

    __tablename__ = "levels"

    id = db.Column(db.Integer, primary_key=True)
    level_number = db.Column(db.Integer, unique=True, nullable=False)
    award = db.Column(db.String(50), nullable=False)
    modules_required = db.Column(db.String(100), nullable=False)
    max_module = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "level_number": self.level_number,
            "award": self.award,
            "modules_required": self.modules_required,
            "max_module": self.max_module,
        }


class Elective(db.Model):
    """Elective / short course. Linked to a programme (Chaplaincy) or standalone."""

    __tablename__ = "electives"

    id = db.Column(db.Integer, primary_key=True)
    programme_id = db.Column(
        db.Integer, db.ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name = db.Column(db.String(200), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)

    programme = db.relationship("Programme", back_populates="electives")

    def to_dict(self):
        return {
            "id": self.id,
            "programme_id": self.programme_id,
            "programme_title": self.programme.short_title if self.programme else None,
            "programme_slug": self.programme.slug if self.programme else None,
            "name": self.name,
            "order": self.order,
        }


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(30), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    country = db.Column(db.String(80), nullable=False)
    county_or_city = db.Column(db.String(80), nullable=False)
    programme_id = db.Column(db.Integer, db.ForeignKey("programmes.id"), nullable=False, index=True)
    level = db.Column(db.Integer, nullable=False)
    highest_education = db.Column(db.String(120), nullable=False)
    church_or_organisation = db.Column(db.String(160))
    how_did_you_hear = db.Column(db.String(120))
    message = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default="New", index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)

    programme = db.relationship("Programme", back_populates="applications")

    def to_dict(self):
        return {
            "id": self.id,
            "reference": self.reference,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "country": self.country,
            "county_or_city": self.county_or_city,
            "programme_id": self.programme_id,
            "programme_title": self.programme.title if self.programme else None,
            "programme_short_title": self.programme.short_title if self.programme else None,
            "level": self.level,
            "highest_education": self.highest_education,
            "church_or_organisation": self.church_or_organisation,
            "how_did_you_hear": self.how_did_you_hear,
            "message": self.message,
            "status": self.status,
            "created_at": iso(self.created_at),
        }


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30))
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "subject": self.subject,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": iso(self.created_at),
        }


class Announcement(db.Model):
    """Intake dates and news shown on the home page."""

    __tablename__ = "announcements"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_published = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "is_published": self.is_published,
            "created_at": iso(self.created_at),
        }


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username}
