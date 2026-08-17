from datetime import date


def _months_ago(months):
    month_index = date.today().month - 1 - months
    year = date.today().year + month_index // 12
    month = month_index % 12 + 1
    day = min(date.today().day, 28)
    return date(year, month, day).isoformat()


def test_dashboard_computes_totals_and_budget(client, register_user):
    headers, _ = register_user()
    client.post(
        "/api/expenses",
        json={"description": "A", "amount": 100, "category": "Food", "date": date.today().isoformat(), "paymentMethod": "Cash"},
        headers=headers,
    )
    client.post(
        "/api/expenses",
        json={"description": "B", "amount": 50, "category": "Food", "date": _months_ago(2), "paymentMethod": "Cash"},
        headers=headers,
    )
    client.put("/api/budget", json={"monthlyLimit": 200}, headers=headers)

    resp = client.get("/api/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["totalSpent"] == 150
    assert data["thisMonthTotal"] == 100
    assert data["expenseCount"] == 2
    assert data["budgetLimit"] == 200
    assert len(data["monthlyTrend"]) == 6


def test_dashboard_is_scoped_per_user(client, register_user):
    headers_a, _ = register_user(email="a@example.com")
    headers_b, _ = register_user(email="b@example.com")
    client.post(
        "/api/expenses",
        json={"description": "A's expense", "amount": 100, "category": "Food", "date": date.today().isoformat(), "paymentMethod": "Cash"},
        headers=headers_a,
    )

    resp = client.get("/api/dashboard", headers=headers_b)
    data = resp.get_json()
    assert data["totalSpent"] == 0
    assert data["expenseCount"] == 0


def test_dashboard_requires_auth(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 401
