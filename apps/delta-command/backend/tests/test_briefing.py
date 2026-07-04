from pathlib import Path
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from delta_command.briefing import build_context
from delta_command.main import app
from delta_command.models import Database


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    data_file = tmp_path / "data.json"
    source = Path(__file__).resolve().parents[1] / "config" / "data.json"
    data_file.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setenv("DELTA_DATA_PATH", str(data_file))
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    return TestClient(app)


def test_build_context_summary_covers_team_pipeline_delivery(client: TestClient) -> None:
    db = Database.model_validate(client.get("/api/state").json())
    context = build_context(db)
    assert "Team:" in context
    assert "Pipeline:" in context
    assert "Delivery:" in context


def test_briefing_returns_503_when_llm_not_configured(client: TestClient) -> None:
    response = client.post("/api/briefing")
    assert response.status_code == 503
    assert "LLM_API_KEY" in response.json()["detail"]


def test_briefing_returns_generated_text_when_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    monkeypatch.setenv("LLM_BASE_URL", "https://example.test/v1")
    monkeypatch.setenv("LLM_MODEL", "test-model")

    captured: dict[str, Any] = {}

    def fake_handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["auth"] = request.headers.get("authorization")
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": "Pipeline is healthy. Watch Marcus at 116%."}}
                ]
            },
        )

    real_async_client = httpx.AsyncClient

    def async_client_factory(*args: Any, **kwargs: Any) -> httpx.AsyncClient:
        return real_async_client(transport=httpx.MockTransport(fake_handler))

    monkeypatch.setattr("delta_command.briefing.httpx.AsyncClient", async_client_factory)

    response = client.post("/api/briefing")
    assert response.status_code == 200
    assert "Pipeline is healthy" in response.json()["briefing"]
    assert captured["url"] == "https://example.test/v1/chat/completions"
    assert captured["auth"] == "Bearer test-key"


def test_briefing_returns_502_when_provider_errors(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    real_async_client = httpx.AsyncClient

    def fake_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="upstream broken")

    monkeypatch.setattr(
        "delta_command.briefing.httpx.AsyncClient",
        lambda *a, **k: real_async_client(transport=httpx.MockTransport(fake_handler)),
    )

    response = client.post("/api/briefing")
    assert response.status_code == 502
    assert "500" in response.json()["detail"]
