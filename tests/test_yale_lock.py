"""Tests for the home dashboard."""

from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from yale_lock.config import Settings
from yale_lock.models import activity_label, serialize_activity
from yale_lock.server import create_app
from yale_lock.unifi_client import UniFiCameraClient


def test_activity_label_known_action() -> None:
    assert activity_label("dooropen") == "Door opened"
    assert activity_label("custom_event") == "Custom Event"


def test_serialize_activity() -> None:
    activity = SimpleNamespace(
        action="unlock",
        activity_id="abc123",
        device_id="lock-1",
        device_name="Front Door",
        activity_start_time=datetime(2026, 1, 1, tzinfo=UTC),
        activity_type=SimpleNamespace(value="lock_operation"),
        operated_by="Remote User",
        calling_user={},
    )

    view = serialize_activity(activity)

    assert view.action == "unlock"
    assert view.label == "Unlocked"
    assert view.operator == "Remote User"


def test_unifi_status_when_not_configured() -> None:
    settings = Settings()
    client = UniFiCameraClient(settings)
    status = client.get_status()

    assert status.configured is False
    assert status.connected is False
    assert status.cameras == []


@pytest.fixture
def test_client() -> TestClient:
    settings = Settings(
        YALE_USERNAME="",
        YALE_PASSWORD="",
        UNIFI_HOST="",
    )
    app = create_app(settings)

    with patch.object(app.state.dashboard, "start", AsyncMock()), patch.object(
        app.state.dashboard, "stop", AsyncMock()
    ):
        with TestClient(app) as client:
            yield client


def test_status_endpoint(test_client: TestClient) -> None:
    response = test_client.get("/api/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["auth_state"] == "not_configured"
    assert payload["camera"]["configured"] is False


def test_index_page(test_client: TestClient) -> None:
    response = test_client.get("/")
    assert response.status_code == 200
    assert "Home Dashboard" in response.text
    assert "UniFi Camera" in response.text
