def _make_expense(description="Groceries", amount=100, category="Food", date="2026-08-17", payment_method="Cash"):
    return {
        "description": description,
        "amount": amount,
        "category": category,
        "date": date,
        "paymentMethod": payment_method,
    }


def test_index_with_no_filters_returns_all_expenses(client, register_user):
    headers, _ = register_user()
    client.post("/api/expenses", json=_make_expense("Groceries"), headers=headers)
    client.post("/api/expenses", json=_make_expense("Internet", category="Utilities"), headers=headers)

    resp = client.get("/api/expenses", headers=headers)
    assert resp.status_code == 200
    assert len(resp.get_json()["expenses"]) == 2


def test_index_filters_by_category(client, register_user):
    headers, _ = register_user()
    client.post("/api/expenses", json=_make_expense("Groceries", category="Food"), headers=headers)
    client.post("/api/expenses", json=_make_expense("Internet", category="Utilities"), headers=headers)

    resp = client.get("/api/expenses?category=Utilities", headers=headers)
    expenses = resp.get_json()["expenses"]
    assert len(expenses) == 1
    assert expenses[0]["description"] == "Internet"


def test_index_filters_by_search_text(client, register_user):
    headers, _ = register_user()
    client.post("/api/expenses", json=_make_expense("Weekly groceries"), headers=headers)
    client.post("/api/expenses", json=_make_expense("Internet bill", category="Utilities"), headers=headers)

    resp = client.get("/api/expenses?q=grocer", headers=headers)
    expenses = resp.get_json()["expenses"]
    assert len(expenses) == 1


def test_index_filters_by_date_range(client, register_user):
    headers, _ = register_user()
    client.post("/api/expenses", json=_make_expense("Old", date="2026-01-01"), headers=headers)
    client.post("/api/expenses", json=_make_expense("Recent", date="2026-08-01"), headers=headers)

    resp = client.get("/api/expenses?from=2026-06-01", headers=headers)
    expenses = resp.get_json()["expenses"]
    assert len(expenses) == 1
    assert expenses[0]["description"] == "Recent"


def test_create_with_valid_payload_adds_expense(client, register_user):
    headers, _ = register_user()
    resp = client.post("/api/expenses", json=_make_expense("New expense"), headers=headers)
    assert resp.status_code == 201

    list_resp = client.get("/api/expenses", headers=headers)
    assert len(list_resp.get_json()["expenses"]) == 1


def test_create_with_invalid_payload_returns_400(client, register_user):
    headers, _ = register_user()
    resp = client.post("/api/expenses", json=_make_expense(""), headers=headers)
    assert resp.status_code == 400

    list_resp = client.get("/api/expenses", headers=headers)
    assert len(list_resp.get_json()["expenses"]) == 0


def test_update_modifies_existing_expense(client, register_user):
    headers, _ = register_user()
    create_resp = client.post("/api/expenses", json=_make_expense("Original"), headers=headers)
    expense_id = create_resp.get_json()["expense"]["id"]

    update_resp = client.put(
        f"/api/expenses/{expense_id}", json=_make_expense("Updated"), headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.get_json()["expense"]["description"] == "Updated"


def test_update_nonexistent_expense_returns_404(client, register_user):
    headers, _ = register_user()
    resp = client.put("/api/expenses/999", json=_make_expense(), headers=headers)
    assert resp.status_code == 404


def test_delete_removes_expense(client, register_user):
    headers, _ = register_user()
    create_resp = client.post("/api/expenses", json=_make_expense(), headers=headers)
    expense_id = create_resp.get_json()["expense"]["id"]

    delete_resp = client.delete(f"/api/expenses/{expense_id}", headers=headers)
    assert delete_resp.status_code == 204

    list_resp = client.get("/api/expenses", headers=headers)
    assert len(list_resp.get_json()["expenses"]) == 0


def test_index_only_returns_current_users_expenses(client, register_user):
    headers_a, _ = register_user(email="a@example.com")
    headers_b, _ = register_user(email="b@example.com")
    client.post("/api/expenses", json=_make_expense("Mine"), headers=headers_a)
    client.post("/api/expenses", json=_make_expense("Someone else's"), headers=headers_b)

    resp = client.get("/api/expenses", headers=headers_a)
    expenses = resp.get_json()["expenses"]
    assert len(expenses) == 1
    assert expenses[0]["description"] == "Mine"


def test_delete_does_not_remove_another_users_expense(client, register_user):
    headers_a, _ = register_user(email="a@example.com")
    headers_b, _ = register_user(email="b@example.com")
    create_resp = client.post("/api/expenses", json=_make_expense(), headers=headers_b)
    expense_id = create_resp.get_json()["expense"]["id"]

    delete_resp = client.delete(f"/api/expenses/{expense_id}", headers=headers_a)
    assert delete_resp.status_code == 404

    list_resp = client.get("/api/expenses", headers=headers_b)
    assert len(list_resp.get_json()["expenses"]) == 1


def test_update_does_not_modify_another_users_expense(client, register_user):
    headers_a, _ = register_user(email="a@example.com")
    headers_b, _ = register_user(email="b@example.com")
    create_resp = client.post("/api/expenses", json=_make_expense("Original"), headers=headers_b)
    expense_id = create_resp.get_json()["expense"]["id"]

    update_resp = client.put(
        f"/api/expenses/{expense_id}", json=_make_expense("Hacked"), headers=headers_a
    )
    assert update_resp.status_code == 404


def test_export_returns_csv_of_filtered_expenses(client, register_user):
    headers, _ = register_user()
    client.post("/api/expenses", json=_make_expense("Groceries", 42.50, "Food"), headers=headers)
    client.post("/api/expenses", json=_make_expense("Internet", 30, "Utilities"), headers=headers)

    resp = client.get("/api/expenses/export?category=Food", headers=headers)
    csv_text = resp.get_data(as_text=True)
    assert "Groceries" in csv_text
    assert "Internet" not in csv_text


def test_categories_endpoint_requires_auth(client):
    resp = client.get("/api/expenses/categories")
    assert resp.status_code == 401
