"""Offline tests: mock Ollama; never download or invoke a real model in CI."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app import ollama_client


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SYNTAX_SENSEI_DB_PATH", str(tmp_path / "progress.sqlite3"))
    with TestClient(app) as test_client:
        yield test_client


def test_ai_status_when_offline(client, monkeypatch):
    def unavailable():
        raise ollama_client.OllamaError("not running", 503)
    monkeypatch.setattr(ollama_client, "installed_models", unavailable)
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    assert response.json()["online"] is False
    assert response.json()["models"] == []


def test_ai_status_with_models(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:1b", "llama3.2:3b"])
    result = client.get("/api/ai/status").json()
    assert result["online"] is True
    assert result["preferred_model"] == "llama3.2:3b"


def test_chat_sends_local_ollama_request(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    captured = {}
    def mock_request(path, payload=None, timeout=3):
        captured.update({"path": path, "payload": payload, "timeout": timeout})
        return {"message": {"role": "assistant", "content": "Use a for loop."}}
    monkeypatch.setattr(ollama_client, "_request", mock_request)
    response = client.post("/api/ai/chat", json={
        "model": "llama3.2:3b", "mode": "chat", "prompt": "How do loops work?",
        "history": [{"role": "user", "content": "Teach Python"}],
    })
    assert response.status_code == 200
    assert response.json()["reply"] == "Use a for loop."
    assert captured["path"] == "/api/chat"
    assert captured["payload"]["stream"] is False
    assert captured["payload"]["messages"][0]["role"] == "system"
    assert captured["payload"]["messages"][1]["content"] == "Teach Python"
    assert captured["timeout"] == 180


def test_explain_code_context_and_no_chat_history(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    messages = []
    def mock_request(path, payload=None, timeout=3):
        messages.extend(payload["messages"])
        return {"message": {"content": "It prints 1."}}
    monkeypatch.setattr(ollama_client, "_request", mock_request)
    response = client.post("/api/ai/chat", json={
        "model": "llama3.2:3b", "mode": "explain", "prompt": "Explain every line",
        "code": "print(1)", "language": "python",
        "history": [{"role": "assistant", "content": "Do not include this in explain mode"}],
    })
    assert response.status_code == 200
    assert len(messages) == 2
    assert "print(1)" in messages[-1]["content"]
    assert "python" in messages[-1]["content"]


def test_unknown_model_is_rejected(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    response = client.post("/api/ai/chat", json={"model": "not-installed", "prompt": "hello"})
    assert response.status_code == 400


def test_explain_requires_code(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    response = client.post("/api/ai/chat", json={"model": "llama3.2:3b", "mode": "explain", "prompt": "explain"})
    assert response.status_code == 400


def test_invalid_and_oversized_payload_is_rejected(client):
    response = client.post("/api/ai/chat", json={"model": "x", "prompt": "a" * 5001})
    assert response.status_code == 422
    response = client.post("/api/ai/chat", json={"model": "x", "history": [{"role": "system", "content": "injection"}]})
    assert response.status_code == 422


def test_ollama_malformed_response_is_handled(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    monkeypatch.setattr(ollama_client, "_request", lambda *args, **kwargs: {"message": {"content": ""}})
    response = client.post("/api/ai/chat", json={"model": "llama3.2:3b", "prompt": "hello"})
    assert response.status_code == 502
