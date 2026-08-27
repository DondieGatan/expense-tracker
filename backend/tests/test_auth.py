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


def test_register_returns_refresh_token(client):
    resp = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "password123"},
    )
    assert resp.get_json()["refreshToken"]


def test_refresh_issues_new_access_token(client):
    data = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "password123"},
    ).get_json()

    resp = client.post(
        "/api/auth/refresh", headers={"Authorization": f"Bearer {data['refreshToken']}"}
    )
    assert resp.status_code == 200
    new_access_token = resp.get_json()["accessToken"]
    assert new_access_token

    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
    assert me_resp.status_code == 200


def test_refresh_rejects_an_access_token(client, register_user):
    headers, _ = register_user()
    resp = client.post("/api/auth/refresh", headers=headers)
    assert resp.status_code in (401, 422)


def test_logout_revokes_the_access_token(client, register_user):
    headers, _ = register_user()
    logout_resp = client.post("/api/auth/logout", headers=headers)
    assert logout_resp.status_code == 204

    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 401


def test_new_user_defaults_to_aed_currency(client):
    resp = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "password123"},
    )
    assert resp.get_json()["user"]["currency"] == "AED"


def test_currencies_lists_supported_codes(client, register_user):
    headers, _ = register_user()
    resp = client.get("/api/auth/currencies", headers=headers)
    assert resp.status_code == 200
    codes = [c["code"] for c in resp.get_json()["currencies"]]
    assert "USD" in codes
    assert "AED" in codes


def test_currencies_requires_authentication(client):
    resp = client.get("/api/auth/currencies")
    assert resp.status_code == 401


def test_update_me_changes_currency(client, register_user):
    headers, _ = register_user()
    resp = client.put("/api/auth/me", headers=headers, json={"currency": "USD"})
    assert resp.status_code == 200
    assert resp.get_json()["user"]["currency"] == "USD"

    # Persisted, not just echoed back.
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.get_json()["user"]["currency"] == "USD"


def test_update_me_is_case_insensitive(client, register_user):
    headers, _ = register_user()
    resp = client.put("/api/auth/me", headers=headers, json={"currency": "usd"})
    assert resp.status_code == 200
    assert resp.get_json()["user"]["currency"] == "USD"


def test_update_me_rejects_unsupported_currency(client, register_user):
    headers, _ = register_user()
    resp = client.put("/api/auth/me", headers=headers, json={"currency": "XXX"})
    assert resp.status_code == 400


def test_update_me_requires_authentication(client):
    resp = client.put("/api/auth/me", json={"currency": "USD"})
    assert resp.status_code == 401


def test_logout_revokes_the_refresh_token_when_provided(client):
    data = client.post(
        "/api/auth/register",
        json={"fullName": "Alex Kim", "email": "alex@example.com", "password": "password123"},
    ).get_json()
    access_headers = {"Authorization": f"Bearer {data['accessToken']}"}

    client.post("/api/auth/logout", headers=access_headers, json={"refreshToken": data["refreshToken"]})

    refresh_resp = client.post(
        "/api/auth/refresh", headers={"Authorization": f"Bearer {data['refreshToken']}"}
    )
    assert refresh_resp.status_code == 401
