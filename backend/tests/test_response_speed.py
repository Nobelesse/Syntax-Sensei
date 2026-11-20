"""Offline regression tests: no Ollama model or network access required."""
import json
from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from backend.app import ollama_client
from backend.app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SYNTAX_SENSEI_DB_PATH", str(tmp_path / "progress.sqlite3"))
    with TestClient(app) as test_client:
        yield test_client


def test_all_answer_depths_request_expected_budgets(monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    for depth, budget in (("quick", 550), ("balanced", 1150), ("detailed", 1900)):
        payload = ollama_client.prepare_chat("llama3.2:3b", "chat", "What is recursion?", "", "Python", [], depth)
        assert payload["options"]["num_predict"] == budget
        assert payload["keep_alive"] == "5m"
        assert "complete fenced code example" in payload["messages"][0]["content"]
        assert "expected output" in payload["messages"][0]["content"].lower()


def test_guided_hints_do_not_give_full_solution(monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["m"])
    payload = ollama_client.prepare_chat("m", "hint", "How do I sort a list?", "", "Python", [], "detailed")
    assert payload["options"]["num_predict"] == 400
    assert "do NOT reveal a complete solution" in payload["messages"][0]["content"]


def test_invalid_depth_is_rejected_before_network(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["m"])
    r = client.post("/api/ai/stream", json={"model": "m", "mode": "chat", "prompt": "hi", "depth": "invalid"})
    assert r.status_code == 422


def test_stream_returns_progressive_chunks_and_final_reply(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["local"])
    monkeypatch.setattr(ollama_client, "_stream_ollama", lambda _payload: iter(["# Python loops\\n", "```python\\nprint(1)\\n```", "\\nDone."]))
    response = client.post("/api/ai/stream", json={"model": "local", "prompt": "Explain for loops", "language": "Python"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.count("event: chunk") == 3
    assert "event: done" in response.text
    frames = response.text.strip().split("\n\n")
    last = json.loads(frames[-1].split("data: ", 1)[1])
    assert last["model"] == "local"
    assert "print(1)" in last["reply"]


def test_stream_error_is_transmitted_without_crashing(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["local"])
    def broken(_payload):
        yield "partial"
        raise ollama_client.OllamaError("temporarily unavailable")
    monkeypatch.setattr(ollama_client, "_stream_ollama", broken)
    response = client.post("/api/ai/stream", json={"model": "local", "prompt": "hello"})
    assert response.status_code == 200
    assert "event: chunk" in response.text
    assert "event: error" in response.text
    assert "temporarily unavailable" in response.text


def test_warmup_uses_empty_prompt_and_no_user_content(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["local"])
    requests = []
    def fake_request(path, payload=None, timeout=3):
        requests.append((path, payload, timeout))
        return {"response": "", "done": True}
    monkeypatch.setattr(ollama_client, "_request", fake_request)
    response = client.post("/api/ai/warmup", json={"model": "local"})
    assert response.status_code == 200
    assert response.json() == {"model": "local", "state": "ready"}
    assert requests[0][0] == "/api/generate"
    assert requests[0][1]["prompt"] == ""
    assert requests[0][1]["stream"] is False
    assert requests[0][2] == 120


def test_uninstalled_model_warmup_does_not_contact_generator(client, monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["local"])
    monkeypatch.setattr(ollama_client, "_request", lambda *_a, **_kw: pytest.fail("No generator call expected"))
    response = client.post("/api/ai/warmup", json={"model": "unknown"})
    assert response.status_code == 400
