from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from delta_command.json_db import load_json
from delta_command.main import app


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    data_file = tmp_path / "data.json"
    source = Path(__file__).resolve().parents[1] / "config" / "data.json"
    data_file.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
    monkeypatch.setenv("DELTA_DATA_PATH", str(data_file))
    return TestClient(app)


def test_state_returns_full_database(client: TestClient) -> None:
    response = client.get("/api/state")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["engineers"]) == 30
    assert len(payload["opportunities"]) >= 6
    assert len(payload["projects"]) >= 1
    assert "lastUpdated" in payload


def test_engineer_has_timeline(client: TestClient) -> None:
    engineers = client.get("/api/state").json()["engineers"]
    timeline = engineers[0]["utilizationTimeline"]
    assert len(timeline) >= 1
    assert set(timeline[0]) >= {"weekStart", "utilization"}


def test_opportunity_stage_update_sets_probability(client: TestClient) -> None:
    resp = client.patch("/api/opportunities", json={"id": "opp-4", "stage": "won"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["stage"] == "won"
    assert body["probability"] == 100


def test_project_status_update_persists(client: TestClient) -> None:
    resp = client.patch("/api/projects", json={"id": "proj-1", "status": "at_risk"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "at_risk"


def test_timeline_cell_update_persists_to_disk(
    client: TestClient, tmp_path: Path
) -> None:
    state = client.get("/api/state").json()
    engineer = state["engineers"][0]
    week = engineer["utilizationTimeline"][0]["weekStart"]

    resp = client.patch(
        "/api/timeline",
        json={"engineerId": engineer["id"], "weekStart": week, "utilization": 72},
    )
    assert resp.status_code == 200

    on_disk = load_json(tmp_path / "data.json")
    updated = next(e for e in on_disk["engineers"] if e["id"] == engineer["id"])
    cell = next(c for c in updated["utilizationTimeline"] if c["weekStart"] == week)
    assert cell["utilization"] == 72


def test_timeline_update_unknown_engineer_returns_404(client: TestClient) -> None:
    resp = client.patch(
        "/api/timeline",
        json={"engineerId": "eng-999", "weekStart": "2026-01-01", "utilization": 50},
    )
    assert resp.status_code == 404
