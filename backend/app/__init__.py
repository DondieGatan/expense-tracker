from flask import Flask, jsonify

from config import Config
from app.extensions import db, migrate, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from app.auth import auth_bp
    from app.expenses import expenses_bp
    from app.budget import budget_bp
    from app.dashboard import dashboard_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(dashboard_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.route("/api/_diag_tcp")
    def diag_tcp():
        import socket
        import time
        import os

        host = os.environ.get("SQL_SERVER", "")
        result = {"host": host}
        start = time.monotonic()
        try:
            sock = socket.create_connection((host, 1433), timeout=10)
            sock.close()
            result["tcp_connect"] = "ok"
        except Exception as e:
            result["tcp_connect"] = f"failed: {type(e).__name__}: {e}"
        result["elapsed_seconds"] = round(time.monotonic() - start, 2)
        return jsonify(result), 200

    @app.route("/api/_diag_db")
    def diag_db():
        import time
        import datetime
        from sqlalchemy import text

        result = {"container_utc_time": datetime.datetime.utcnow().isoformat()}
        start = time.monotonic()
        try:
            db.session.execute(text("SELECT 1"))
            result["db_connect"] = "ok"
        except Exception as e:
            result["db_connect"] = f"failed: {type(e).__name__}: {e}"
        result["elapsed_seconds"] = round(time.monotonic() - start, 2)
        return jsonify(result), 200

    @jwt.unauthorized_loader
    def unauthorized(reason):
        return jsonify({"error": "Authentication required."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid or expired token."}), 401

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return jsonify({"error": "Session expired, please log in again."}), 401

    @jwt.revoked_token_loader
    def revoked_token(header, payload):
        return jsonify({"error": "This session has been logged out."}), 401

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(header, payload):
        from app.models import TokenBlocklist
        jti = payload["jti"]
        return db.session.query(TokenBlocklist.id).filter_by(jti=jti).first() is not None

    return app
