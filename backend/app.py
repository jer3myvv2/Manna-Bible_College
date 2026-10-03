"""Flask application factory for the Manna College & Manna Bible Institute API.

Run in development:   flask --app app run --debug
Run in production:    gunicorn -w 3 -b 127.0.0.1:8000 "app:create_app()"
"""
import mimetypes
import os

from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config
from models import db, upgrade_schema
from routes.admin import bp as admin_bp
from routes.public import bp as public_bp
from utils import json_error

# Python does not know the web app manifest type by default.
mimetypes.add_type("application/manifest+json", ".webmanifest")


def create_app(config_class=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)
    app.json.sort_keys = False

    if app.config.get("TRUST_PROXY"):
        # Behind Nginx: trust one proxy hop for the client IP and scheme.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        expose_headers=["Content-Disposition"],
    )
    _configure_jwt(JWTManager(app))

    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    _register_error_handlers(app)
    _register_frontend(app)

    with app.app_context():
        db.create_all()
        upgrade_schema()

    if not app.debug and not app.testing and "dev-only" in (app.config["SECRET_KEY"] + app.config["JWT_SECRET_KEY"]):
        app.logger.warning("SECRET_KEY / JWT_SECRET_KEY are using development defaults. Set them in backend/.env.")

    return app


def _configure_jwt(jwt):
    """Return JWT problems in the API's standard {"error": "..."} shape."""

    @jwt.unauthorized_loader
    def _missing_token(_reason):
        return json_error("Authentication required. Please log in.", 401)

    @jwt.invalid_token_loader
    def _invalid_token(_reason):
        return json_error("Invalid session token. Please log in again.", 401)

    @jwt.expired_token_loader
    def _expired_token(_header, _payload):
        return json_error("Your session has expired. Please log in again.", 401)

    @jwt.revoked_token_loader
    def _revoked_token(_header, _payload):
        return json_error("Your session has been revoked. Please log in again.", 401)


def _is_api_request():
    return request.path.startswith("/api/") or request.path == "/api"


def _register_error_handlers(app):
    messages = {
        400: "Bad request.",
        401: "Authentication required.",
        403: "You do not have permission to do that.",
        404: "Not found.",
        405: "Method not allowed.",
        413: "Request is too large.",
        429: "Too many requests.",
    }

    @app.errorhandler(HTTPException)
    def _http_error(error):
        if _is_api_request():
            return json_error(messages.get(error.code, error.name), error.code)
        if error.code == 404 and _frontend_index_exists(app):
            # Unknown non-API path: let React Router show the right page (or its 404).
            return send_from_directory(app.config["FRONTEND_DIST"], "index.html")
        return error

    @app.errorhandler(Exception)
    def _unexpected_error(error):
        app.logger.exception("Unhandled error: %s", error)
        db.session.rollback()
        return json_error("Something went wrong on our side. Please try again later.", 500)


def _frontend_index_exists(app):
    return os.path.isfile(os.path.join(app.config["FRONTEND_DIST"], "index.html"))


def _register_frontend(app):
    """Serve the built React app (frontend/dist) when it exists.

    In development the Vite dev server serves the frontend instead.
    """
    dist = app.config["FRONTEND_DIST"]

    @app.get("/")
    @app.get("/<path:path>")
    def _frontend(path=""):
        if path == "api" or path.startswith("api/"):
            return json_error("Not found.", 404)
        if not _frontend_index_exists(app):
            return json_error(
                "Frontend not built. Run the Vite dev server or `npm run build` in frontend/.", 404
            )
        full_path = os.path.join(dist, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")
