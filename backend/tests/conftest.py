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
