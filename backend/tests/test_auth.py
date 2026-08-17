def test_register_creates_user_and_returns_token(client):
    resp = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["accessToken"]
    assert data["user"]["email"] == "alex@example.com"
    assert data["user"]["fullName"] == "Alex Kim"


def test_register_rejects_duplicate_email(client, register_user):
    register_user(email="dupe@example.com")
    resp = client.post(
        "/api/auth/register",
        json={"fullName": "Someone Else", "email": "dupe@example.com", "password": "password123"},
    )
    assert resp.status_code == 400


def test_register_rejects_short_password(client):
    resp = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "abc"},
    )
    assert resp.status_code == 400


def test_login_with_correct_password_succeeds(client, register_user):
    register_user(email="alex@example.com", password="password123")
    resp = client.post("/api/auth/login", json={"email": "alex@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert resp.get_json()["accessToken"]


def test_login_with_wrong_password_fails(client, register_user):
    register_user(email="alex@example.com", password="password123")
    resp = client.post("/api/auth/login", json={"email": "alex@example.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_me_requires_authentication(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, register_user):
    headers, _ = register_user(email="alex@example.com")
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["user"]["email"] == "alex@example.com"
