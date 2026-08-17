from flask import Blueprint

budget_bp = Blueprint("budget", __name__, url_prefix="/api/budget")

from app.budget import routes  # noqa: E402,F401
