from flask import Blueprint

expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

from app.expenses import routes  # noqa: E402,F401
