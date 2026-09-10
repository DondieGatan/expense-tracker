import os
from datetime import timedelta


def _build_db_uri():
    # DATABASE_URL takes priority — used for the Postgres (Neon) production
    # DB after the Azure SQL server it originally ran on was decommissioned.
    # Local dev is untouched and keeps using the MSSQL branch below.
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # Normalize to the psycopg3 driver regardless of which scheme the
        # host hands us (Neon gives "postgresql://", some hosts give the
        # legacy Heroku-style "postgres://").
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        if database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return database_url

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

    # Used to email password-reset codes — see app/email.py. Free-tier
    # SendGrid only needs Single Sender Verification (no domain/DNS), which
    # is why it's the provider used across this project's siblings too.
    SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
    SENDGRID_FROM = os.environ.get("SENDGRID_FROM")

    # In-memory storage — fine for a single free-tier instance (WEB_CONCURRENCY=1),
    # but resets on restart and won't share state across multiple instances.
    RATELIMIT_ENABLED = True

    SQLALCHEMY_DATABASE_URI = _build_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestConfig(Config):
    TESTING = True
    RATELIMIT_ENABLED = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
