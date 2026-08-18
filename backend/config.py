import os
from datetime import timedelta


def _build_db_uri():
    server = os.environ.get("SQL_SERVER", r"localhost\SQLEXPRESS")
    database = os.environ.get("SQL_DATABASE", "ExpenseTrackerDb")
    driver = os.environ.get("SQL_DRIVER", "ODBC Driver 17 for SQL Server").replace(" ", "+")
    trusted = os.environ.get("SQL_TRUSTED_CONNECTION", "yes").lower() == "yes"
    username = os.environ.get("SQL_USERNAME", "")
    password = os.environ.get("SQL_PASSWORD", "")

    if trusted:
        return (
            f"mssql+pyodbc://@{server}/{database}"
            f"?driver={driver}&trusted_connection=yes&TrustServerCertificate=yes"
        )
    return (
        f"mssql+pyodbc://{username}:{password}@{server}/{database}"
        f"?driver={driver}&TrustServerCertificate=yes"
    )


def _build_cors_origins():
    raw = os.environ.get("CORS_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    # Local dev web previews only, by default — a browser-based client (the
    # Expo web build) is the only thing CORS restricts; the native mobile
    # app isn't subject to it. Widen via CORS_ORIGINS if a web build is
    # ever deployed somewhere else.
    return [
        "http://localhost:8093",
        "http://localhost:8094",
        "http://localhost:19006",
    ]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "expense-tracker-dev-secret")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "expense-tracker-jwt-dev-secret-please-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_BLOCKLIST_ENABLED = True
    JWT_BLOCKLIST_TOKEN_CHECKS = ["access", "refresh"]

    CORS_ORIGINS = _build_cors_origins()

    # In-memory storage — fine for a single free-tier instance (WEB_CONCURRENCY=1),
    # but resets on restart and won't share state across multiple instances.
    RATELIMIT_ENABLED = True

    SQLALCHEMY_DATABASE_URI = _build_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestConfig(Config):
    TESTING = True
    RATELIMIT_ENABLED = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
