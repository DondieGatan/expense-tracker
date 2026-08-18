from flask import Flask, jsonify

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
