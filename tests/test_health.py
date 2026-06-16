"""
Tests for health check endpoint.
Run: pytest tests/test_health.py -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_status_200():
    response = client.get("/")
    assert response.status_code == 200


def test_health_check_body():
    response = client.get("/")
    assert response.json() == {"status": "healthy"}


def test_health_check_content_type():
    response = client.get("/")
    assert "application/json" in response.headers["content-type"]
