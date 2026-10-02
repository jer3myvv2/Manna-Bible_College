# Manna College & Manna Bible Institute Website

Website for the **Virtual Satellite Class**: TVET accredited online Certificate and Diploma programmes
(Level 4, 5 & 6) in Christian Ministry, Counselling Psychology and Christian Chaplaincy.

- **Frontend:** React 18 (JavaScript) + Vite, React Router v6, Axios, plain CSS with theme variables
- **Backend:** Python 3.10+ / Flask, Flask-SQLAlchemy on SQLite (`manna.db`), Flask-JWT-Extended, Flask-CORS
- All programme content (programmes, modules, units, levels, electives, announcements, contact details)
  comes from the API. Nothing is hard-coded in React.

```
manna-website/
├── backend/
│   ├── app.py              # Flask app factory, registers blueprints, serves frontend/dist in production
│   ├── config.py           # Secrets from .env + SITE_INFO (phone, emails, class time, taglines)
│   ├── models.py           # SQLAlchemy models
│   ├── seed.py             # Creates tables; loads programmes, modules, units, levels, electives, admin user
│   ├── utils.py            # Validation, JSON errors, honeypot + rate limiting
│   ├── routes/public.py    # Public GET endpoints + application / contact forms
│   ├── routes/admin.py     # JWT-protected admin endpoints
│   ├── tests/test_api.py   # API tests (python -m unittest discover tests)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/images/      # Placeholder images (replace with real photos)
    ├── src/api/            # Axios client (client.js), public.js, admin.js
    ├── src/assets/logo.svg # Placeholder A Ω laurel logo (replace with the official logo)
    ├── src/components/     # Navbar, Footer, ProgrammeCard, ModuleCard, LevelProgression, ...
    ├── src/pages/          # Home, Programmes, ProgrammeDetail, ShortCourses, Apply, About, Contact, NotFound
    ├── src/pages/admin/    # Admin login + dashboard pages
    ├── src/styles/         # theme.css (colours/fonts), base, layout, components, pages, admin
    ├── package.json
    └── .env.example
```

## Local setup

```bash
# backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit SECRET_KEY, JWT_SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD
python seed.py
flask --app app run --debug        # http://localhost:5000

# frontend (in a second terminal)
cd frontend
npm install
cp .env.example .env               # VITE_API_URL=http://localhost:5000/api
npm run dev                        # http://localhost:5173
```

Admin dashboard: <http://localhost:5173/admin/login>, using the `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `backend/.env`.

> **macOS note:** macOS's AirPlay Receiver can occupy port 5000. If Flask fails to start, either turn off
> *System Settings → General → AirDrop & Handoff → AirPlay Receiver*, or run
> `flask --app app run --debug --port 5001` and set `VITE_API_URL=http://localhost:5001/api`.

### Useful commands

| Command (in `backend/`) | What it does |
|---|---|
| `python seed.py` | Creates tables and adds anything missing. Safe to re-run. Also resets the admin password to the value in `.env`. |
| `python seed.py --reset` | **Deletes all data** (including applications) and seeds from scratch. |
| `python -m unittest discover tests -v` | Runs the API tests against an in-memory database. |

## Editing content

| What | Where |
|---|---|
| Programmes, modules, units, electives / short courses, announcements, level awards | Admin dashboard (`/admin`) |
| Phone, WhatsApp, emails, websites, class time, taglines | `SITE_INFO` in `backend/config.py` (served by `GET /api/info`) |
| Logo | Replace `frontend/src/assets/logo.svg` (same filename). Also `frontend/public/favicon.svg`. |
| Photos | Replace the files in `frontend/public/images/` (see below) |
| Colours and fonts | `frontend/src/styles/theme.css` |

**Photos** in `frontend/public/images/` are free stock photos from [Unsplash](https://unsplash.com/license)
(free for commercial use, no attribution required). Replace them with the school's own photos whenever possible,
keeping the same filenames:

| File | Used for | Photo |
|---|---|---|
| `hero-african-student-studying-on-laptop.jpg` | Home page hero (900×964) | [Joyce Busola](https://unsplash.com/photos/Nnv0DHFG1Ds) |
| `bible-background.jpg`, `bible-background-mobile.jpg` | Background behind the maroon hero bands (desktop / phone) | [Aaron Burden](https://unsplash.com/photos/TNlHf4m4gpI) |
| `programme-christian-ministry.jpg` | Christian Ministry card and page (1200×750) | [Andile Mnothoza](https://unsplash.com/photos/K5yNGK2Jw4w) |
| `programme-counselling-psychology.jpg` | Counselling Psychology card and page (1200×750) | [Christina @ wocintechchat.com](https://unsplash.com/photos/LQ1t-8Ms5PY) |
| `programme-christian-chaplaincy.jpg` | Christian Chaplaincy card and page (1200×750) | [Jametlene Reskp](https://unsplash.com/photos/YUVZOGlHfdk) |

Programme photos are set per programme in the admin (*Hero image path*). The Bible background is set by
`--bible-photo` in `frontend/src/styles/theme.css`.

**Placeholder text:** the About page's mission paragraph, the institution descriptions and the emblem
explanation were not supplied by the school. They appear inside a dashed box labelled *"Placeholder text: school
to edit"* (the `<PlaceholderNote>` component in `frontend/src/pages/About.jsx`). Replace the wording, then remove
the wrapper. Each programme's short description was also written from its module list. Review it in the admin.

## API overview (prefix `/api`)

Public: `GET /programmes[?category=]`, `GET /programmes/<slug>`, `GET /levels`, `GET /electives[?q=]`,
`GET /announcements`, `GET /info`, `POST /applications` (returns `201 {"reference": "MC-2026-0001"}`),
`POST /contact`, `GET /health`.

Admin (header `Authorization: Bearer <token>` from `POST /admin/login`):
`GET /admin/stats`, `GET /admin/applications[?programme_id=&level=&status=&q=&page=]`,
`PATCH /admin/applications/<id>`, `GET /admin/applications/export` (CSV), `GET|PATCH|DELETE /admin/messages[/<id>]`,
full CRUD for `/admin/programmes`, `/admin/programmes/<id>/modules`, `/admin/modules/<id>`,
`/admin/modules/<id>/units`, `/admin/units/<id>`, `/admin/electives`, `/admin/announcements`, and
`GET /admin/levels`, `PATCH /admin/levels/<id>`.

Errors are always JSON: `{"error": "..."}`. Validation errors add `"fields": {"email": "..."}`.
Public forms have a hidden honeypot field and are rate limited (5 submissions per 10 minutes per IP); admin
login allows 10 attempts per 15 minutes.

## Production deployment

1. **Server prep** (Ubuntu example): install Python 3.10+, Node 20+ (only needed to build), Nginx.
2. **Backend:**
   ```bash
   cd /srv/manna-website/backend
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env     # set strong SECRET_KEY / JWT_SECRET_KEY, ADMIN_PASSWORD, TRUST_PROXY=true
   python seed.py
   ```
3. **Frontend build** (API on the same domain):
   ```bash
   cd /srv/manna-website/frontend
   npm ci
   VITE_API_URL=/api npm run build      # outputs frontend/dist/
   ```
4. **Run Flask with Gunicorn.** Flask automatically serves `frontend/dist/` (including client-side routes such
   as `/programmes/christian-ministry`) when it exists:
   ```bash
   gunicorn -w 3 -b 127.0.0.1:8000 "app:create_app()"
   ```
   A systemd unit keeps it running:
   ```ini
   # /etc/systemd/system/manna.service
   [Unit]
   Description=Manna website
   After=network.target

   [Service]
   WorkingDirectory=/srv/manna-website/backend
   ExecStart=/srv/manna-website/backend/venv/bin/gunicorn -w 3 -b 127.0.0.1:8000 "app:create_app()"
   Restart=always
   User=www-data

   [Install]
   WantedBy=multi-user.target
   ```
5. **Nginx.** Either proxy everything to Gunicorn, or (faster) let Nginx serve the static build and proxy only `/api`:
   ```nginx
   server {
       server_name www.mannacollege.ac.ke mannacollege.ac.ke;
       root /srv/manna-website/frontend/dist;

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       location / {
           try_files $uri /index.html;   # React Router handles the page
       }
   }
   ```
   Then enable HTTPS with `sudo certbot --nginx`. The same build can serve `www.mannabibleinstitute.org` by adding it
   to `server_name`.
6. **Notes:**
   - Set `TRUST_PROXY=true` behind Nginx so rate limiting sees real client IPs.
   - If the frontend is hosted on a different domain from the API, set `CORS_ORIGINS` and build with the full API URL.
   - The rate limiter is in-memory, per Gunicorn worker. For multiple servers use Flask-Limiter with Redis.
   - Back up `backend/manna.db` regularly (e.g. a nightly `sqlite3 manna.db ".backup manna-$(date +%F).db"`).
     SQLite comfortably handles this site's traffic; switch `DATABASE_URL` to PostgreSQL if you ever need more.
   - Gunicorn does not run on Windows. Use `waitress-serve --call app:create_app` there.
