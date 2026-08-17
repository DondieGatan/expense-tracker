import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import request, jsonify, Response
from flask_jwt_extended import jwt_required

from app.expenses import expenses_bp
from app.extensions import db
from app.models import Expense
from app.constants import EXPENSE_CATEGORIES, PAYMENT_METHODS
from app.utils import current_user_id


def _parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _validate_payload(data):
    description = (data.get("description") or "").strip()
    category = (data.get("category") or "").strip()
    payment_method = (data.get("paymentMethod") or "").strip()
    notes = (data.get("notes") or "").strip() or None
    parsed_date = _parse_date(data.get("date"))

    if not description or len(description) > 150:
        return None, "Description is required and must be 150 characters or fewer."
    if not category or len(category) > 50:
        return None, "Category is required."
    if not payment_method or len(payment_method) > 30:
        return None, "Payment method is required."
    if parsed_date is None:
        return None, "A valid date is required."
    if notes is not None and len(notes) > 300:
        return None, "Notes must be 300 characters or fewer."

    try:
        amount = Decimal(str(data.get("amount")))
    except (InvalidOperation, TypeError):
        return None, "A valid amount is required."
    if amount < Decimal("0.01") or amount > Decimal("1000000"):
        return None, "Amount must be between 0.01 and 1,000,000."

    return {
        "description": description,
        "amount": amount,
        "category": category,
        "date": parsed_date,
        "payment_method": payment_method,
        "notes": notes,
    }, None


def _apply_filters(query, args):
    category = args.get("category")
    q = args.get("q")
    date_from = _parse_date(args.get("from"))
    date_to = _parse_date(args.get("to"))

    if category:
        query = query.filter(Expense.category == category)
    if q:
        query = query.filter(Expense.description.ilike(f"%{q}%"))
    if date_from:
        query = query.filter(Expense.date >= date_from)
    if date_to:
        query = query.filter(Expense.date <= date_to)
    return query


@expenses_bp.route("/categories", methods=["GET"])
@jwt_required()
def categories():
    return jsonify({"categories": EXPENSE_CATEGORIES, "paymentMethods": PAYMENT_METHODS}), 200


@expenses_bp.route("", methods=["GET"])
@jwt_required()
def list_expenses():
    query = Expense.query.filter_by(user_id=current_user_id())
    query = _apply_filters(query, request.args)
    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()
    return jsonify({"expenses": [e.to_dict() for e in expenses]}), 200


@expenses_bp.route("/export", methods=["GET"])
@jwt_required()
def export_expenses():
    query = Expense.query.filter_by(user_id=current_user_id())
    query = _apply_filters(query, request.args)
    expenses = query.order_by(Expense.date.desc(), Expense.id.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Description", "Amount", "Category", "Date", "PaymentMethod", "Notes"])
    for e in expenses:
        writer.writerow([e.description, e.amount, e.category, e.date.isoformat(), e.payment_method, e.notes or ""])

    filename = f"expenses-{date.today().isoformat()}.csv"
    return Response(
        buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@expenses_bp.route("/<int:expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id()).first()
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404
    return jsonify({"expense": expense.to_dict()}), 200


@expenses_bp.route("", methods=["POST"])
@jwt_required()
def create_expense():
    data = request.get_json(silent=True) or {}
    fields, error = _validate_payload(data)
    if error:
        return jsonify({"error": error}), 400

    expense = Expense(user_id=current_user_id(), **fields)
    db.session.add(expense)
    db.session.commit()
    return jsonify({"expense": expense.to_dict()}), 201


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id()).first()
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404

    data = request.get_json(silent=True) or {}
    fields, error = _validate_payload(data)
    if error:
        return jsonify({"error": error}), 400

    for key, value in fields.items():
        setattr(expense, key, value)
    db.session.commit()
    return jsonify({"expense": expense.to_dict()}), 200


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id()).first()
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404

    db.session.delete(expense)
    db.session.commit()
    return "", 204
