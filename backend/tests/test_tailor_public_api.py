from datetime import date, timedelta


# Content endpoints
def test_get_services_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/services", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert isinstance(first.get("id"), str) and first["id"]
    assert isinstance(first.get("title"), str) and first["title"]
    assert isinstance(first.get("category"), str) and first["category"]
    assert isinstance(first.get("image_url"), str) and first["image_url"].startswith("http")


def test_get_gallery_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/gallery", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert isinstance(first.get("id"), str) and first["id"]
    assert first.get("category") in ["men", "women", "bridal"]
    assert isinstance(first.get("title"), str) and first["title"]


def test_get_contact_content(api_client, base_url):
    response = api_client.get(f"{base_url}/api/content/contact", timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data.get("shop_name"), str) and data["shop_name"]
    assert isinstance(data.get("phone"), str) and data["phone"]
    assert isinstance(data.get("email"), str) and "@" in data["email"]
    assert isinstance(data.get("map_embed_url"), str) and data["map_embed_url"].startswith("http")


# Design request endpoints
def test_create_design_request_and_verify_list(api_client, base_url):
    create_payload = {
        "name": "TEST_Agent Design",
        "phone": "+1000000001",
        "message": "TEST design request from automated pytest",
        "image_name": "test-look.png",
        "style_category": "Men",
    }
    create_response = api_client.post(
        f"{base_url}/api/design-requests", json=create_payload, timeout=20
    )
    assert create_response.status_code == 200

    created = create_response.json()
    assert isinstance(created.get("id"), str) and created["id"]
    assert created.get("name") == create_payload["name"]
    assert created.get("phone") == create_payload["phone"]
    assert created.get("message") == create_payload["message"]
    assert created.get("status") == "new"

    list_response = api_client.get(f"{base_url}/api/design-requests", timeout=20)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert isinstance(listed, list)
    assert any(row.get("id") == created["id"] for row in listed)


# Appointment endpoints
def test_create_appointment_and_verify_list(api_client, base_url):
    future_date = (date.today() + timedelta(days=3)).isoformat()
    create_payload = {
        "name": "TEST_Agent Appointment",
        "phone": "+1000000002",
        "service_type": "Men's Suits",
        "appointment_date": future_date,
        "notes": "TEST appointment from automated pytest",
    }
    create_response = api_client.post(
        f"{base_url}/api/appointments", json=create_payload, timeout=20
    )
    assert create_response.status_code == 200

    created = create_response.json()
    assert isinstance(created.get("id"), str) and created["id"]
    assert created.get("name") == create_payload["name"]
    assert created.get("phone") == create_payload["phone"]
    assert created.get("service_type") == create_payload["service_type"]
    assert created.get("appointment_date") == future_date
    assert created.get("status") == "booked"

    list_response = api_client.get(f"{base_url}/api/appointments", timeout=20)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert isinstance(listed, list)
    assert any(row.get("id") == created["id"] for row in listed)


def test_appointment_validation_error_for_invalid_date(api_client, base_url):
    bad_payload = {
        "name": "TEST_Bad Date",
        "phone": "+1000000003",
        "service_type": "Bridal Wear",
        "appointment_date": "02-31-2026",
        "notes": "should fail",
    }
    response = api_client.post(f"{base_url}/api/appointments", json=bad_payload, timeout=20)
    assert response.status_code == 422

    data = response.json()
    assert "detail" in data
