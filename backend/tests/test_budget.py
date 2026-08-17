def test_get_budget_returns_none_when_not_set(client, register_user):
    headers, _ = register_user()
    resp = client.get("/api/budget", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["budget"] is None


def test_put_creates_budget_when_none_exists(client, register_user):
    headers, _ = register_user()
    resp = client.put("/api/budget", json={"monthlyLimit": 500}, headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["budget"]["monthlyLimit"] == 500


def test_put_updates_existing_budget(client, register_user):
    headers, _ = register_user()
    client.put("/api/budget", json={"monthlyLimit": 100}, headers=headers)
    resp = client.put("/api/budget", json={"monthlyLimit": 750}, headers=headers)
    assert resp.get_json()["budget"]["monthlyLimit"] == 750

    get_resp = client.get("/api/budget", headers=headers)
    assert get_resp.get_json()["budget"]["monthlyLimit"] == 750


def test_budget_is_scoped_per_user(client, register_user):
    headers_a, _ = register_user(email="a@example.com")
    headers_b, _ = register_user(email="b@example.com")
    client.put("/api/budget", json={"monthlyLimit": 100}, headers=headers_a)

    resp = client.get("/api/budget", headers=headers_b)
    assert resp.get_json()["budget"] is None
