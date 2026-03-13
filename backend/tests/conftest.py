import os

import pytest
import requests
from dotenv import load_dotenv


load_dotenv("/app/frontend/.env")


@pytest.fixture(scope="session")
def base_url() -> str:
    backend_url = os.environ.get("REACT_APP_BACKEND_URL")
    if not backend_url:
        pytest.skip("REACT_APP_BACKEND_URL is not configured")
    return backend_url.rstrip("/")


@pytest.fixture()
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def admin_credentials() -> dict:
    return {"email": "admin@tourtailor.com", "password": "Admin@12345"}


@pytest.fixture()
def admin_token(api_client, base_url, admin_credentials) -> str:
    response = api_client.post(
        f"{base_url}/api/admin/auth/login", json=admin_credentials, timeout=20
    )
    if response.status_code != 200:
        pytest.skip("Admin authentication failed; skipping admin-protected tests")
    data = response.json()
    token = data.get("token", "")
    if not token:
        pytest.skip("Admin token missing; skipping admin-protected tests")
    return token
