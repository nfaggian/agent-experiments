"""Shared pytest fixtures."""

from __future__ import annotations

from collections.abc import Iterator
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from yale_lock.config import Settings
from yale_lock.server import create_app


@pytest.fixture
def test_client() -> Iterator[TestClient]:
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
