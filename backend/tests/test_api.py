"""API smoke tests. Run from backend/:  python -m unittest discover tests -v"""
import contextlib
import io
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app  # noqa: E402
from config import TestConfig  # noqa: E402
from models import AdminUser, db  # noqa: E402
import seed  # noqa: E402

VALID_APPLICATION = {
    "full_name": "Grace Wanjiru",
    "email": "grace@example.com",
    "phone": "0712 345 678",
    "country": "Kenya",
    "county_or_city": "Nairobi",
    "level": 4,
    "highest_education": "Secondary (KCSE / equivalent)",
    "how_did_you_hear": "WhatsApp",
}


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        with self.app.app_context(), contextlib.redirect_stdout(io.StringIO()):
            seed.seed_levels()
            seed.seed_programmes()
            seed.seed_electives()
            seed.seed_announcements()
            admin = AdminUser(username="admin")
            admin.set_password("secret-password")
            db.session.add(admin)
            db.session.commit()
            from models import Programme

            self.programme_id = Programme.query.filter_by(slug="counselling-psychology").first().id

    def tearDown(self):
        with self.app.app_context():
            db.drop_all()

    def login(self):
        res = self.client.post("/api/admin/login", json={"username": "admin", "password": "secret-password"})
        self.assertEqual(res.status_code, 200)
        return {"Authorization": f"Bearer {res.get_json()['access_token']}"}

    # Public ------------------------------------------------------------------
    def test_programmes_list(self):
        data = self.client.get("/api/programmes").get_json()
        self.assertEqual([p["slug"] for p in data], ["christian-ministry", "counselling-psychology", "christian-chaplaincy"])
        self.assertEqual([p["module_count"] for p in data], [6, 6, 6])
        self.assertEqual([p["unit_count"] for p in data], [22, 20, 21])
        self.assertEqual(data[0]["level_label"], "Level 4, 5 & 6")
        self.assertEqual(data[0]["award_label"], "Certificate | Diploma")
        theology = self.client.get("/api/programmes?category=theology").get_json()
        self.assertEqual(len(theology), 2)

    def test_programme_detail(self):
        data = self.client.get("/api/programmes/christian-chaplaincy").get_json()
        self.assertEqual(data["modules"][0]["roman"], "I")
        self.assertEqual(data["modules"][0]["units"][0]["name"], "Digital Literacy")
        self.assertEqual(len(data["electives"]), 24)
        self.assertEqual(len(data["levels"]), 3)
        res = self.client.get("/api/programmes/does-not-exist")
        self.assertEqual(res.status_code, 404)
        self.assertIn("error", res.get_json())

    def test_info_levels_electives_announcements(self):
        info = self.client.get("/api/info").get_json()
        self.assertEqual(info["phone"], "+254 115 254 478")
        self.assertEqual(len(self.client.get("/api/levels").get_json()), 3)
        self.assertEqual(len(self.client.get("/api/electives?q=trauma").get_json()), 2)
        self.assertEqual(len(self.client.get("/api/announcements").get_json()), 1)

    def test_application_success_and_reference(self):
        res = self.client.post("/api/applications", json={**VALID_APPLICATION, "programme_id": self.programme_id})
        self.assertEqual(res.status_code, 201, res.get_json())
        ref = res.get_json()["reference"]
        self.assertRegex(ref, r"^MC-\d{4}-0001$")
        res2 = self.client.post("/api/applications", json={**VALID_APPLICATION, "programme_id": self.programme_id})
        self.assertTrue(res2.get_json()["reference"].endswith("-0002"))

    def test_application_validation(self):
        bad = {**VALID_APPLICATION, "email": "nope", "phone": "12345", "level": 9, "programme_id": 999}
        res = self.client.post("/api/applications", json=bad)
        self.assertEqual(res.status_code, 400)
        fields = res.get_json()["fields"]
        self.assertEqual(set(fields), {"email", "phone", "level", "programme_id"})

    def test_phone_formats(self):
        for phone in ["+254 115 254 478", "0115254478", "254712345678", "+256 772 123 456", "0044 20 7946 0958"]:
            res = self.client.post(
                "/api/applications", json={**VALID_APPLICATION, "phone": phone, "programme_id": self.programme_id}
            )
            self.assertEqual(res.status_code, 201, (phone, res.get_json()))

    def test_honeypot(self):
        res = self.client.post(
            "/api/applications", json={**VALID_APPLICATION, "programme_id": self.programme_id, "website": "spam"}
        )
        self.assertEqual(res.status_code, 400)

    def test_contact(self):
        res = self.client.post(
            "/api/contact",
            json={"name": "Peter", "email": "peter@example.com", "subject": "Fees", "message": "Please send me details."},
        )
        self.assertEqual(res.status_code, 201)
        res = self.client.post("/api/contact", json={"name": "P"})
        self.assertEqual(res.status_code, 400)

    def test_rate_limit(self):
        self.app.config["RATE_LIMIT_ENABLED"] = True
        from utils import limiter

        limiter.reset()
        payload = {"name": "Peter", "email": "peter@example.com", "subject": "Hello", "message": "Testing the limit."}
        codes = [self.client.post("/api/contact", json=payload).status_code for _ in range(6)]
        self.assertEqual(codes, [201] * 5 + [429])
        limiter.reset()

    # Admin -------------------------------------------------------------------
    def test_admin_requires_token(self):
        res = self.client.get("/api/admin/applications")
        self.assertEqual(res.status_code, 401)
        self.assertIn("error", res.get_json())
        res = self.client.post("/api/admin/login", json={"username": "admin", "password": "wrong"})
        self.assertEqual(res.status_code, 401)

    def test_admin_applications_flow(self):
        headers = self.login()
        self.client.post("/api/applications", json={**VALID_APPLICATION, "programme_id": self.programme_id})
        data = self.client.get(f"/api/admin/applications?programme_id={self.programme_id}&level=4&q=grace", headers=headers).get_json()
        self.assertEqual(data["total"], 1)
        app_id = data["items"][0]["id"]
        res = self.client.patch(f"/api/admin/applications/{app_id}", json={"status": "Admitted"}, headers=headers)
        self.assertEqual(res.get_json()["status"], "Admitted")
        res = self.client.patch(f"/api/admin/applications/{app_id}", json={"status": "Bogus"}, headers=headers)
        self.assertEqual(res.status_code, 400)
        res = self.client.get("/api/admin/applications/export?status=Admitted", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res.content_type)
        self.assertIn("Grace Wanjiru", res.get_data(as_text=True))
        stats = self.client.get("/api/admin/stats", headers=headers).get_json()
        self.assertEqual(stats["totals"]["applications"], 1)
        self.assertEqual(stats["by_status"]["Admitted"], 1)

    def test_admin_crud(self):
        headers = self.login()
        # Programme
        res = self.client.post(
            "/api/admin/programmes",
            json={"title": "Certificate in Test", "short_title": "Test Programme", "category": "Theology"},
            headers=headers,
        )
        self.assertEqual(res.status_code, 201, res.get_json())
        programme = res.get_json()
        self.assertEqual(programme["slug"], "test-programme")
        # Module + unit
        res = self.client.post(f"/api/admin/programmes/{programme['id']}/modules", json={"number": 1, "title": "Intro"}, headers=headers)
        module = res.get_json()
        self.assertEqual(module["roman"], "I")
        res = self.client.post(f"/api/admin/programmes/{programme['id']}/modules", json={"number": 1, "title": "Dup"}, headers=headers)
        self.assertEqual(res.status_code, 400)
        unit = self.client.post(f"/api/admin/modules/{module['id']}/units", json={"name": "Unit A"}, headers=headers).get_json()
        self.assertEqual(unit["order"], 1)
        self.assertEqual(self.client.patch(f"/api/admin/units/{unit['id']}", json={"name": "Unit B"}, headers=headers).get_json()["name"], "Unit B")
        self.assertEqual(self.client.delete(f"/api/admin/modules/{module['id']}", headers=headers).status_code, 200)
        # Electives
        elective = self.client.post("/api/admin/electives", json={"name": "New Course"}, headers=headers).get_json()
        self.assertEqual(elective["order"], 25)
        self.assertEqual(self.client.delete(f"/api/admin/electives/{elective['id']}", headers=headers).status_code, 200)
        # Announcements
        ann = self.client.post("/api/admin/announcements", json={"title": "Intake", "body": "January intake", "is_published": False}, headers=headers).get_json()
        self.assertEqual(len(self.client.get("/api/announcements").get_json()), 1)
        self.client.patch(f"/api/admin/announcements/{ann['id']}", json={"is_published": True}, headers=headers)
        self.assertEqual(len(self.client.get("/api/announcements").get_json()), 2)
        # Levels
        level_id = self.client.get("/api/levels").get_json()[0]["id"]
        res = self.client.patch(f"/api/admin/levels/{level_id}", json={"award": "Certificate (Level 4)"}, headers=headers)
        self.assertEqual(res.get_json()["award"], "Certificate (Level 4)")
        # Programme with applications cannot be deleted
        self.client.post("/api/applications", json={**VALID_APPLICATION, "programme_id": self.programme_id})
        self.assertEqual(self.client.delete(f"/api/admin/programmes/{self.programme_id}", headers=headers).status_code, 409)
        self.assertEqual(self.client.delete(f"/api/admin/programmes/{programme['id']}", headers=headers).status_code, 200)

    def test_messages(self):
        headers = self.login()
        self.client.post(
            "/api/contact",
            json={"name": "Peter", "email": "peter@example.com", "subject": "Fees", "message": "Please send me details."},
        )
        messages = self.client.get("/api/admin/messages", headers=headers).get_json()
        self.assertFalse(messages[0]["is_read"])
        res = self.client.patch(f"/api/admin/messages/{messages[0]['id']}", json={"is_read": True}, headers=headers)
        self.assertTrue(res.get_json()["is_read"])

    def test_unknown_api_route_is_json(self):
        res = self.client.get("/api/nope")
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.get_json(), {"error": "Not found."})


if __name__ == "__main__":
    unittest.main()
