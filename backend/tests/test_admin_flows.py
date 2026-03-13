from datetime import date, timedelta


# Admin authentication and protected endpoints
def test_admin_login_success(api_client, base_url, admin_credentials):
    response = api_client.post(
        f"{base_url}/api/admin/auth/login", json=admin_credentials, timeout=20
    )
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert data.get("admin_email") == admin_credentials["email"]
    assert isinstance(data.get("admin_name"), str) and data["admin_name"]


def test_admin_dashboard_protected_without_token(api_client, base_url):
    response = api_client.get(f"{base_url}/api/admin/stats", timeout=20)
    assert response.status_code == 401

    data = response.json()
    assert "detail" in data


def test_admin_stats_with_token(api_client, base_url, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = api_client.get(f"{base_url}/api/admin/stats", headers=headers, timeout=20)
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data.get("total_designs"), int)
    assert isinstance(data.get("total_appointments"), int)
    assert isinstance(data.get("total_orders"), int)


# Admin design + user visibility + status update flows
def test_admin_create_design_and_verify_public_visibility(api_client, base_url, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    unique_suffix = date.today().isoformat()
    payload = {
        "title": f"TEST_Admin Design {unique_suffix}",
        "category": "men",
        "description": "TEST design created via pytest",
        "image_url": "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=80",
        "price_note": "Starting from $399",
        "is_active": True,
    }

    create_response = api_client.post(
        f"{base_url}/api/admin/designs", json=payload, headers=headers, timeout=20
    )
    assert create_response.status_code == 200

    created = create_response.json()
    assert isinstance(created.get("id"), str) and created["id"]
    assert created.get("title") == payload["title"]
    design_id = created["id"]

    public_response = api_client.get(f"{base_url}/api/content/designs", timeout=20)
    assert public_response.status_code == 200
    public_designs = public_response.json()
    public_match = next((row for row in public_designs if row.get("id") == design_id), None)
    assert public_match is not None
    assert public_match.get("title") == payload["title"]


def test_admin_update_appointment_and_order_status(api_client, base_url, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    designs_res = api_client.get(f"{base_url}/api/content/designs", timeout=20)
    assert designs_res.status_code == 200
    designs = designs_res.json()
    assert isinstance(designs, list) and len(designs) >= 1
    design = designs[0]

    appointment_payload = {
        "name": "TEST_Admin Status Appointment",
        "phone": "+1000000101",
        "appointment_date": (date.today() + timedelta(days=5)).isoformat(),
        "notes": "Status update verification",
        "design_id": design["id"],
        "design_title": design["title"],
    }
    create_appointment = api_client.post(
        f"{base_url}/api/appointments", json=appointment_payload, timeout=20
    )
    assert create_appointment.status_code == 200
    appointment_id = create_appointment.json()["id"]

    order_payload = {
        "name": "TEST_Admin Status Order",
        "phone": "+1000000102",
        "design_id": design["id"],
        "design_title": design["title"],
        "quantity": 1,
        "message": "Status update verification",
    }
    create_order = api_client.post(f"{base_url}/api/orders", json=order_payload, timeout=20)
    assert create_order.status_code == 200
    order_id = create_order.json()["id"]

    update_appointment = api_client.patch(
        f"{base_url}/api/admin/appointments/{appointment_id}/status",
        json={"status": "confirmed"},
        headers=headers,
        timeout=20,
    )
    assert update_appointment.status_code == 200
    assert update_appointment.json().get("status") == "confirmed"

    list_appointments = api_client.get(
        f"{base_url}/api/admin/appointments", headers=headers, timeout=20
    )
    assert list_appointments.status_code == 200
    appt_match = next(
        (row for row in list_appointments.json() if row.get("id") == appointment_id), None
    )
    assert appt_match is not None
    assert appt_match.get("status") == "confirmed"

    update_order = api_client.patch(
        f"{base_url}/api/admin/orders/{order_id}/status",
        json={"status": "completed"},
        headers=headers,
        timeout=20,
    )
    assert update_order.status_code == 200
    assert update_order.json().get("status") == "completed"

    list_orders = api_client.get(f"{base_url}/api/admin/orders", headers=headers, timeout=20)
    assert list_orders.status_code == 200
    order_match = next((row for row in list_orders.json() if row.get("id") == order_id), None)
    assert order_match is not None
    assert order_match.get("status") == "completed"


# Forgot/reset password round-trip (restore default password in same test)
def test_admin_forgot_reset_password_and_restore_default(api_client, base_url, admin_credentials):
    email = admin_credentials["email"]
    default_password = admin_credentials["password"]
    temp_password = "Admin@54321"

    forgot_response = api_client.post(
        f"{base_url}/api/admin/auth/forgot-password", json={"email": email}, timeout=20
    )
    assert forgot_response.status_code == 200
    forgot_data = forgot_response.json()
    assert isinstance(forgot_data.get("reset_code"), str) and len(forgot_data["reset_code"]) == 6

    reset_response = api_client.post(
        f"{base_url}/api/admin/auth/reset-password",
        json={
            "email": email,
            "reset_code": forgot_data["reset_code"],
            "new_password": temp_password,
        },
        timeout=20,
    )
    assert reset_response.status_code == 200
    assert "message" in reset_response.json()

    login_temp = api_client.post(
        f"{base_url}/api/admin/auth/login",
        json={"email": email, "password": temp_password},
        timeout=20,
    )
    assert login_temp.status_code == 200
    assert isinstance(login_temp.json().get("token"), str) and login_temp.json()["token"]

    forgot_restore = api_client.post(
        f"{base_url}/api/admin/auth/forgot-password", json={"email": email}, timeout=20
    )
    assert forgot_restore.status_code == 200
    restore_code = forgot_restore.json().get("reset_code", "")
    assert isinstance(restore_code, str) and len(restore_code) == 6

    restore_response = api_client.post(
        f"{base_url}/api/admin/auth/reset-password",
        json={
            "email": email,
            "reset_code": restore_code,
            "new_password": default_password,
        },
        timeout=20,
    )
    assert restore_response.status_code == 200

    login_default = api_client.post(
        f"{base_url}/api/admin/auth/login",
        json={"email": email, "password": default_password},
        timeout=20,
    )
    assert login_default.status_code == 200
    assert isinstance(login_default.json().get("token"), str) and login_default.json()["token"]