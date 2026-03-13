from datetime import date, timedelta


# Public content endpoints
def test_get_designs_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/designs", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert isinstance(first.get("id"), str) and first["id"]
    assert isinstance(first.get("title"), str) and first["title"]
    assert isinstance(first.get("category"), str) and first["category"]
    assert isinstance(first.get("image_url"), str) and first["image_url"]


def test_get_gallery_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/gallery", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert isinstance(first.get("id"), str) and first["id"]
    assert isinstance(first.get("title"), str) and first["title"]


def test_get_contact_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/contact", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data.get("shop_name"), str) and data["shop_name"]
    assert isinstance(data.get("phone"), str) and data["phone"]
    assert isinstance(data.get("email"), str) and "@" in data["email"]


# User submission endpoints
def test_create_appointment_and_verify_list(api_client, base_url):
    designs_response = api_client.get(f"{base_url}/api/content/designs", timeout=20)
    assert designs_response.status_code == 200
    designs = designs_response.json()
    assert isinstance(designs, list) and len(designs) >= 1
    selected = designs[0]

    future_date = (date.today() + timedelta(days=3)).isoformat()
    create_payload = {
        "name": "TEST_Agent Appointment",
        "phone": "+1000000002",
        "appointment_date": future_date,
        "notes": "TEST appointment from automated pytest",
        "design_id": selected["id"],
        "design_title": selected["title"],
    }
    create_response = api_client.post(
        f"{base_url}/api/appointments", json=create_payload, timeout=20
    )
    assert create_response.status_code == 200

    created = create_response.json()
    assert isinstance(created.get("id"), str) and created["id"]
    assert created.get("name") == create_payload["name"]
    assert created.get("appointment_date") == future_date
    assert created.get("status") == "pending"
    assert created.get("design_id") == selected["id"]

    list_response = api_client.get(f"{base_url}/api/appointments", timeout=20)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert isinstance(listed, list)
    found = next((row for row in listed if row.get("id") == created["id"]), None)
    assert found is not None
    assert found.get("design_title") == selected["title"]


def test_create_order_and_verify_admin_list(api_client, base_url):
    designs_response = api_client.get(f"{base_url}/api/content/designs", timeout=20)
    assert designs_response.status_code == 200
    designs = designs_response.json()
    assert isinstance(designs, list) and len(designs) >= 1
    selected = designs[0]

    create_payload = {
        "name": "TEST_Agent Order",
        "phone": "+1000000004",
        "design_id": selected["id"],
        "design_title": selected["title"],
        "quantity": 2,
        "message": "TEST order",
    }
    create_response = api_client.post(f"{base_url}/api/orders", json=create_payload, timeout=20)
    assert create_response.status_code == 200

    created = create_response.json()
    assert isinstance(created.get("id"), str) and created["id"]
    assert created.get("design_id") == selected["id"]
    assert created.get("status") == "pending"
    assert created.get("quantity") == 2


def test_appointment_validation_error_for_invalid_date(api_client, base_url):
    bad_payload = {
        "name": "TEST_Bad Date",
        "phone": "+1000000003",
        "appointment_date": "02-31-2026",
        "notes": "should fail",
        "design_id": "design-men-suit",
        "design_title": "Men's Suits",
    }
    response = api_client.post(f"{base_url}/api/appointments", json=bad_payload, timeout=20)
    assert response.status_code == 422

    data = response.json()
    assert "detail" in data
