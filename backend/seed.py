"""Create the database tables and load the programme data.

Usage:
    python seed.py            # create tables and add anything missing (safe to re-run)
    python seed.py --reset    # DROP every table first, then seed from scratch

The admin account is taken from ADMIN_USERNAME / ADMIN_PASSWORD in backend/.env.
Re-running the script updates that admin's password to the current value.
"""
import argparse
import os
import sys

from app import create_app
from models import AdminUser, Announcement, Elective, Level, Module, Programme, Unit, db, to_roman

# ---------------------------------------------------------------------------
# Level progression (same for all programmes; editable later in the admin)
# ---------------------------------------------------------------------------
LEVELS = [
    {"level_number": 4, "award": "Certificate", "modules_required": "I & II", "max_module": 2},
    {"level_number": 5, "award": "Diploma", "modules_required": "I, II, III & IV", "max_module": 4},
    {"level_number": 6, "award": "Diploma", "modules_required": "I, II, III, IV, V & VI", "max_module": 6},
]

THEOLOGY_TAGLINE = "Quality Theological Education. Equipping Leaders. Transforming Lives."
PSYCHOLOGY_TAGLINE = "Quality Education. Equipping Leaders. Transforming Lives."

# ---------------------------------------------------------------------------
# Programmes → modules → units (exactly as on the posters)
# The descriptions only summarise the modules below; edit them in the admin.
# ---------------------------------------------------------------------------
PROGRAMMES = [
    {
        "slug": "christian-ministry",
        "title": "Certificate | Diploma in Christian Ministry",
        "short_title": "Christian Ministry",
        "category": "Theology",
        "tagline": THEOLOGY_TAGLINE,
        "accreditation_note": "TVET Accredited",
        "hero_image": "/images/programme-christian-ministry.jpg",
        "description": (
            "Prepare for effective, Bible-centred ministry through our Virtual Satellite Class. "
            "Six modules take you from Foundational Ministry and Ministry Practice through "
            "Professional & Administrative Skills to Advanced Ministry Practice and "
            "Leadership & Governance."
        ),
        "modules": [
            ("Foundational Ministry", [
                "Ministry of the Word I",
                "Church Mission Operations",
                "Pastoral Ministry I",
            ]),
            ("Ministry Practice", [
                "Chaplaincy Principles",
                "Conducting Spiritual Services",
                "Church Community Activities I",
            ]),
            ("Support & Ministry Expansion", [
                "Digital Literacy",
                "Communication Skills",
                "Ministry of the Word II",
                "Coordination of Church Missions",
                "Church Community Activities II",
            ]),
            ("Professional & Administrative Skills", [
                "Work Ethics & Practices",
                "Entrepreneurial Skills",
                "Guarding Christian Faith I",
                "Church Administrative Duties",
                "Pastoral Ministry II",
            ]),
            ("Advanced Ministry Practice", [
                "Guarding Christian Faith II",
                "Developing Christian Believers",
                "Pastoral Counselling Services",
            ]),
            ("Leadership & Governance", [
                "Ministry of the Word III",
                "Church Ordinances & Ceremonies",
                "Church Management & Governance",
            ]),
        ],
    },
    {
        "slug": "counselling-psychology",
        "title": "Certificate | Diploma in Counselling Psychology",
        "short_title": "Counselling Psychology",
        "category": "Psychology",
        "tagline": PSYCHOLOGY_TAGLINE,
        "accreditation_note": "TVET CDACC",
        "hero_image": "/images/programme-counselling-psychology.jpg",
        "description": (
            "A TVET CDACC programme that builds practical counselling skills, from Basic "
            "Counselling Services and Psychological First Aid to Marriage & Family, Addiction, "
            "Crisis & Trauma Counselling and the management of counselling services."
        ),
        "modules": [
            ("Foundations", [
                "Basic Counselling Services",
                "Communication Skills",
                "Digital Literacy",
            ]),
            ("Community & Support", [
                "Psychological First Aid (PFA)",
                "Entrepreneurial Skills",
                "Community Counselling",
            ]),
            ("Professional Practice", [
                "Administrative Services in Counselling",
                "Work Ethics and Practices",
            ]),
            ("Core Counselling Practice", [
                "Client Assessment",
                "Career Guidance & Counselling",
                "Workplace Counselling",
                "Special Needs & Disability Counselling",
            ]),
            ("Specialized Counselling", [
                "Marriage & Family Counselling",
                "Child & Adolescent Counselling",
                "Addiction Counselling",
                "Loss, Grief & Bereavement Counselling",
            ]),
            ("Advanced & Management", [
                "Research in Counselling",
                "Mental Illnesses Counselling",
                "Crisis & Trauma Counselling",
                "Counselling Services Management",
            ]),
        ],
    },
    {
        "slug": "christian-chaplaincy",
        "title": "Certificate | Diploma in Christian Chaplaincy",
        "short_title": "Christian Chaplaincy",
        "category": "Theology",
        "tagline": THEOLOGY_TAGLINE,
        "accreditation_note": "TVET Accredited",
        "hero_image": "/images/programme-christian-chaplaincy.jpg",
        "description": (
            "Equips you to provide spiritual care and psychological support, from Chaplaincy "
            "Principles and Ethics to Palliative Care, Conflict Resolution and Old & New "
            "Testament Survey, with 24 elective short courses to deepen your calling."
        ),
        "modules": [
            ("Foundations of Chaplaincy", [
                "Digital Literacy",
                "Chaplaincy Principles",
                "Chaplaincy Ethics & Morality",
                "Spiritual Care",
            ]),
            ("Ministry Practice", [
                "Communication Skills",
                "Ministry of the Word I",
                "Spiritual Services",
                "Grief & Loss Counselling",
            ]),
            ("Professional & Theological Foundations", [
                "Work Ethics & Practices",
                "Religious Faiths",
                "Entrepreneurial Skills",
                "Christian Beliefs",
            ]),
            ("Advanced Professional Skills", [
                "Chaplaincy Research",
                "Human Psychology",
                "Conflict Resolution",
            ]),
            ("Specialized Chaplaincy Care", [
                "Psychological Support",
                "Religious Ordinance",
                "Palliative Care",
            ]),
            ("Advanced Theology & Ministry", [
                "Ministry of the Word II",
                "Old Testament Survey",
                "New Testament Survey",
            ]),
        ],
    },
]

# Chaplaincy electives / short courses (also listed on the Short Courses page).
CHAPLAINCY_ELECTIVES = [
    "Introduction to Counselling Psychology",
    "Ministry amidst Conflicts",
    "Human Development, Identity and Sexuality",
    "Conflict Resolution and Mediation",
    "Loss and Grief",
    "Family Counsel",
    "Jail, Detention and Reintegration",
    "Disaster and Emergency Response",
    "CPE Verbatims",
    "Social Justice",
    "Group Dynamics, Social Thinking and Behavior",
    "Life Skills",
    "Trauma Healing",
    "Mental Health",
    "Addiction & Recovery",
    "Addiction & Recovery Ministry",
    "Pastoral Care for Children & Youth",
    "Service to the Elderly",
    "Care for the Sick and Terminally Ill",
    "Addiction & Substance Abuse Care",
    "Suicide Prevention and Intervention",
    "Community Development & Peace Building",
    "Chaplaincy in the Workplace",
    "Trauma-Informed Care",
]

# Starter announcement, built only from the poster details. Add intake dates in the admin.
ANNOUNCEMENTS = [
    {
        "title": "Enrolment is open: Virtual Satellite Class",
        "body": (
            "Enroll today for our Certificate and Diploma programmes in Christian Ministry, "
            "Counselling Psychology and Christian Chaplaincy (Level 4, 5 & 6). Classes run live "
            "online from 8:00PM to 9:30PM East Africa Time (EAT), so you can study from any "
            "location on your laptop, tablet or smartphone. Call or WhatsApp +254 115 254 478 "
            "for the next intake date."
        ),
        "is_published": True,
    }
]


def seed_levels():
    added = 0
    for row in LEVELS:
        if Level.query.filter_by(level_number=row["level_number"]).first() is None:
            db.session.add(Level(**row))
            added += 1
    print(f"  Levels: {added} added")


def seed_programmes():
    for data in PROGRAMMES:
        if Programme.query.filter_by(slug=data["slug"]).first():
            print(f"  Programme '{data['short_title']}' already exists (skipped)")
            continue
        programme = Programme(
            slug=data["slug"],
            title=data["title"],
            short_title=data["short_title"],
            category=data["category"],
            tagline=data["tagline"],
            description=data["description"],
            accreditation_note=data["accreditation_note"],
            hero_image=data["hero_image"],
            is_active=True,
        )
        for number, (module_title, units) in enumerate(data["modules"], start=1):
            module = Module(number=number, roman=to_roman(number), title=module_title)
            module.units = [Unit(name=name, order=order) for order, name in enumerate(units, start=1)]
            programme.modules.append(module)
        db.session.add(programme)
        unit_total = sum(len(units) for _title, units in data["modules"])
        print(f"  Programme '{data['short_title']}': {len(data['modules'])} modules, {unit_total} units")
    db.session.flush()


def seed_electives():
    chaplaincy = Programme.query.filter_by(slug="christian-chaplaincy").first()
    if Elective.query.count():
        print("  Electives already exist (skipped)")
        return
    for order, name in enumerate(CHAPLAINCY_ELECTIVES, start=1):
        db.session.add(Elective(name=name, order=order, programme_id=chaplaincy.id if chaplaincy else None))
    print(f"  Electives: {len(CHAPLAINCY_ELECTIVES)} added")


def seed_announcements():
    if Announcement.query.count():
        print("  Announcements already exist (skipped)")
        return
    for row in ANNOUNCEMENTS:
        db.session.add(Announcement(**row))
    print(f"  Announcements: {len(ANNOUNCEMENTS)} added")


def seed_admin():
    username = (os.environ.get("ADMIN_USERNAME") or "").strip()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    if not username or not password:
        print("  ! ADMIN_USERNAME / ADMIN_PASSWORD not set in .env, so no admin user was created.")
        return
    if len(password) < 8:
        print("  ! ADMIN_PASSWORD must be at least 8 characters, so no admin user was created.")
        return
    admin = AdminUser.query.filter_by(username=username).first()
    if admin is None:
        admin = AdminUser(username=username)
        db.session.add(admin)
        print(f"  Admin user '{username}' created")
    else:
        print(f"  Admin user '{username}' exists; password updated from .env")
    admin.set_password(password)


def main():
    parser = argparse.ArgumentParser(description="Seed the Manna website database.")
    parser.add_argument("--reset", action="store_true", help="drop all tables before seeding")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.reset:
            print("Dropping all tables...")
            db.drop_all()
        db.create_all()
        print(f"Seeding {app.config['SQLALCHEMY_DATABASE_URI']}")
        seed_levels()
        seed_programmes()
        seed_electives()
        seed_announcements()
        seed_admin()
        db.session.commit()
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
