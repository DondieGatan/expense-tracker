from decimal import Decimal, InvalidOperation

from flask import request, jsonify
from flask_jwt_extended import jwt_required

from app.budget import budget_bp
from app.extensions import db
from app.models import Budget
from app.utils import current_user_id


@budget_bp.route("", methods=["GET"])
@jwt_required()
def get_budget():
    budget = Budget.query.filter_by(user_id=current_user_id()).first()
    return jsonify({"budget": budget.to_dict() if budget else None}), 200


@budget_bp.route("", methods=["PUT"])
@jwt_required()
def upsert_budget():
    data = request.get_json(silent=True) or {}
    try:
        monthly_limit = Decimal(str(data.get("monthlyLimit")))
    except (InvalidOperation, TypeError):
        return jsonify({"error": "A valid monthly limit is required."}), 400
    if monthly_limit < 0 or monthly_limit > Decimal("1000000"):
        return jsonify({"error": "Monthly limit must be between 0 and 1,000,000."}), 400

    budget = Budget.query.filter_by(user_id=current_user_id()).first()
    if budget is None:
        budget = Budget(user_id=current_user_id(), monthly_limit=monthly_limit)
        db.session.add(budget)
    else:
        budget.monthly_limit = monthly_limit

    db.session.commit()
    return jsonify({"budget": budget.to_dict()}), 200
