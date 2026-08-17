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


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "expense-tracker-dev-secret")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "expense-tracker-jwt-dev-secret-please-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    SQLALCHEMY_DATABASE_URI = _build_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
