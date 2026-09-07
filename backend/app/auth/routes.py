import random
import re
import string
from datetime import datetime, timedelta, timezone

from flask import request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import generate_password_hash, check_password_hash

from app.auth import auth_bp
from app.extensions import db, limiter
from app.models import User, TokenBlocklist, PasswordResetCode
from app.constants import CURRENCIES, CURRENCY_CODES
from app.utils import current_user_id
from app.email import send_email

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
RESET_CODE_TTL_MINUTES = 15


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _generate_reset_code():
    return "".join(random.choices(string.digits, k=6))


def _tokens_for(user):
    return {
        "accessToken": create_access_token(identity=str(user.id)),
        "refreshToken": create_refresh_token(identity=str(user.id)),
    }


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name:
        return jsonify({"error": "Full name is required."}), 400
    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "A valid email is required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 400

    user = User(full_name=full_name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({**_tokens_for(user), "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({**_tokens_for(user), "user": user.to_dict()}), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    return jsonify({"accessToken": create_access_token(identity=identity)}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    db.session.add(TokenBlocklist(jti=jti))

    data = request.get_json(silent=True) or {}
    refresh_token = data.get("refreshToken")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            db.session.add(TokenBlocklist(jti=payload["jti"]))
        except Exception:
            pass

    db.session.commit()
    return "", 204


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if user is None:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    user = db.session.get(User, current_user_id())
    if user is None:
        return jsonify({"error": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    currency = (data.get("currency") or "").strip().upper()
    if currency not in CURRENCY_CODES:
        return jsonify({"error": "Not a supported currency."}), 400

    user.currency = currency
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/currencies", methods=["GET"])
@jwt_required()
def currencies():
    return jsonify({"currencies": CURRENCIES}), 200


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5 per minute")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    user = User.query.filter_by(email=email).first()

    code = None
    if user is not None:
        code = _generate_reset_code()
        db.session.add(PasswordResetCode(
            user_id=user.id,
            code_hash=generate_password_hash(code),
            expires_at=_utcnow() + timedelta(minutes=RESET_CODE_TTL_MINUTES),
        ))
        db.session.commit()
        send_email(
            user.email,
            "Reset your Expense Tracker password",
            f"<p>Your password reset code is:</p><h2>{code}</h2>"
            f"<p>This code expires in {RESET_CODE_TTL_MINUTES} minutes. "
            f"If you didn't request this, you can safely ignore this email.</p>",
        )

    response = {"message": "If an account with that email exists, a reset code has been sent."}
    # Test-only escape hatch so the reset flow can be exercised end-to-end
    # without a real SendGrid key — never present outside TESTING.
    if current_app.config.get("TESTING") and code:
        response["debugCode"] = code
    return jsonify(response), 200


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5 per minute")
def reset_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    new_password = data.get("newPassword") or ""

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    user = User.query.filter_by(email=email).first()
    reset_row = None
    if user is not None:
        reset_row = (
            PasswordResetCode.query
            .filter_by(user_id=user.id, used=False)
            .order_by(PasswordResetCode.id.desc())
            .first()
        )

    valid = (
        user is not None
        and reset_row is not None
        and reset_row.expires_at >= _utcnow()
        and check_password_hash(reset_row.code_hash, code)
    )
    if not valid:
        return jsonify({"error": "Invalid or expired reset code."}), 400

    user.set_password(new_password)
    reset_row.used = True
    db.session.commit()
    return jsonify({"message": "Password updated. You can now log in."}), 200
