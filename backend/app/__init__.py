from flask import Flask, jsonify, request

from config import Config
from app.extensions import db, migrate, jwt, cors, limiter


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    limiter.init_app(app)

    # Render's free tier doesn't support a Pre-Deploy Command (paid-tier
    # only), and running "flask db upgrade" as a separate step before
    # gunicorn in the boot command meant every cold start paid for a whole
    # second Python/Flask/DB-connect cycle just to check the migration
    # version. Running it here instead means it's part of the one process
    # gunicorn was already starting, not a duplicate one. Skipped under
    # TESTING — the test suite builds its schema with db.create_all()
    # against an in-memory SQLite DB, not Alembic migrations.
    if not app.config.get("TESTING"):
        with app.app_context():
            from flask_migrate import upgrade
            upgrade()

    from app.auth import auth_bp
    from app.expenses import expenses_bp
    from app.budget import budget_bp
    from app.dashboard import dashboard_bp
    from app.ai import ai_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(ai_bp)

    # TEMPORARY: find out which address and headers Render's proxy gives the app, so the rate limiter can key on the real
    # client instead of the proxy. Logs the first 20 requests after each start (health checks skipped), then stops.
    # Remove this once ProxyFix is configured to match what the log shows.
    ip_log_left = [20]

    @app.before_request
    def log_client_address():
        if ip_log_left[0] <= 0 or request.path == "/api/health":
            return
        ip_log_left[0] -= 1
        h = request.headers
        app.logger.warning(
            "client-ip-debug remote_addr=%s x-forwarded-for=%s x-real-ip=%s true-client-ip=%s cf-connecting-ip=%s",
            request.remote_addr, h.get("X-Forwarded-For"), h.get("X-Real-IP"),
            h.get("True-Client-IP"), h.get("CF-Connecting-IP"),
        )

    @app.route("/api/health")
    @limiter.exempt  # the keep-awake ping calls this every 10 minutes and must not use up the shared request budget
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "Too many requests. Please try again shortly."}), 429

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
