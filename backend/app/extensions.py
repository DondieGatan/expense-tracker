from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
# Applies to every route without its own @limiter.limit (dashboard, expenses, budget, ...). A normal tab visit makes
# 1-3 requests, so the old 50 per hour / 200 per day ran out after about 40 tab visits; these leave room for real use
# while still stopping a runaway client. The sign-in and AI routes keep their own stricter limits.
limiter = Limiter(key_func=get_remote_address, default_limits=["3000 per day", "600 per hour"])
