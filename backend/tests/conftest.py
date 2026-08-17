import pytest

from app import create_app
from app.extensions import db as _db
from config import TestConfig


@pytest.fixture()
def app():
    flask_app = create_app(TestConfig)
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def register_user(client):
    def _register(email="alex@example.com", password="password123", full_name="Alex Kim"):
        resp = client.post(
            "/api/auth/register",
            json={"fullName": full_name, "email": email, "password": password},
        )
        data = resp.get_json()
        headers = {"Authorization": f"Bearer {data['accessToken']}"}
        return headers, data["user"]["id"]

    return _register
