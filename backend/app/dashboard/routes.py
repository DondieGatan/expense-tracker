import calendar
from datetime import date

from flask import jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func, extract

from app.dashboard import dashboard_bp
from app.extensions import db
from app.models import Expense, Budget
from app.utils import current_user_id


def _add_months(d, months):
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


@dashboard_bp.route("", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = current_user_id()
    today = date.today()
    start_of_month = today.replace(day=1)
    trend_start = _add_months(start_of_month, -5)

    total_spent = (
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user_id)
        .scalar()
    )
    this_month_total = (
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user_id, Expense.date >= start_of_month)
        .scalar()
    )
    expense_count = Expense.query.filter_by(user_id=user_id).count()

    category_rows = (
        db.session.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(Expense.user_id == user_id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )
    by_category = [{"category": row.category, "total": float(row.total)} for row in category_rows]

    recent_expenses = (
        Expense.query.filter_by(user_id=user_id)
        .order_by(Expense.date.desc(), Expense.id.desc())
        .limit(5)
        .all()
    )

    trend_rows = (
        db.session.query(
            extract("year", Expense.date).label("year"),
            extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total"),
        )
        .filter(Expense.user_id == user_id, Expense.date >= trend_start)
        .group_by(extract("year", Expense.date), extract("month", Expense.date))
        .all()
    )
    trend_lookup = {(int(row.year), int(row.month)): float(row.total) for row in trend_rows}

    monthly_trend = []
    for i in range(6):
        month_date = _add_months(trend_start, i)
        monthly_trend.append({
            "label": calendar.month_abbr[month_date.month],
            "total": trend_lookup.get((month_date.year, month_date.month), 0.0),
        })

    budget = Budget.query.filter_by(user_id=user_id).first()

    return jsonify({
        "totalSpent": float(total_spent),
        "thisMonthTotal": float(this_month_total),
        "expenseCount": expense_count,
        "byCategory": by_category,
        "recentExpenses": [e.to_dict() for e in recent_expenses],
        "monthlyTrend": monthly_trend,
        "budgetLimit": float(budget.monthly_limit) if budget else None,
    }), 200
