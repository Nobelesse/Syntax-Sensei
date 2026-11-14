"""API and database tests: run from project root with pytest backend/tests -q."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SYNTAX_SENSEI_DB_PATH", str(tmp_path / "nested" / "progress.sqlite3"))
    with TestClient(app) as test_client:
        yield test_client


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_bootstrap_has_preview_lessons_and_feature_flags(client):
    response = client.get("/api/bootstrap")
    assert response.status_code == 200
    data = response.json()
    assert data["phase"] == 1
    assert len(data["lessons"]) == 3
    assert data["features"]["ai_chat"] == "planned_phase_2"
    assert data["progress"]["completed_count"] == 0


def test_progress_can_be_completed_and_uncompleted(client):
    path = "/api/lessons/python-hello/progress"
    response = client.post(path, json={"completed": True})
    assert response.status_code == 200
    assert response.json()["progress"]["completed_ids"] == ["python-hello"]
    assert client.get("/api/bootstrap").json()["progress"]["completed_count"] == 1
    response = client.post(path, json={"completed": False})
    assert response.status_code == 200
    assert response.json()["progress"]["completed_count"] == 0


def test_unknown_lesson_is_rejected(client):
    response = client.post("/api/lessons/does-not-exist/progress", json={"completed": True})
    assert response.status_code == 404


def test_invalid_payload_is_rejected(client):
    response = client.post("/api/lessons/python-hello/progress", json={"completed": "incorrect"})
    assert response.status_code == 422


def test_progress_persists_across_client_restarts(tmp_path, monkeypatch):
    monkeypatch.setenv("SYNTAX_SENSEI_DB_PATH", str(tmp_path / "persist.sqlite3"))
    with TestClient(app) as first:
        first.post("/api/lessons/python-variables/progress", json={"completed": True}).raise_for_status()
    with TestClient(app) as second:
        progress = second.get("/api/bootstrap").json()["progress"]
        assert "python-variables" in progress["completed_ids"]
