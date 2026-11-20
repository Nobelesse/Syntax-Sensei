"""Check teaching depth and complete local reference with mocked Ollama responses."""
from backend.app import ollama_client
from backend.app.teaching_guides import (
    PYTHON_OPERATOR_FAMILIES, PYTHON_OPERATOR_GUIDE, ensure_operator_coverage,
    wants_python_operator_overview,
)


def test_python_operator_guide_has_all_seven_categories():
    assert len(PYTHON_OPERATOR_FAMILIES) == 7
    for family in PYTHON_OPERATOR_FAMILIES:
        assert family.lower() in PYTHON_OPERATOR_GUIDE.lower()
    assert "not in" in PYTHON_OPERATOR_GUIDE
    assert "is not" in PYTHON_OPERATOR_GUIDE
    assert "==" in PYTHON_OPERATOR_GUIDE


def test_broad_python_operator_question_detected_but_narrow_questions_are_not():
    assert wants_python_operator_overview("Types of Operators in Python?", "", "chat")
    assert wants_python_operator_overview("Explain operators", "Python", "chat")
    assert not wants_python_operator_overview("Explain the membership operator in Python", "Python", "chat")
    assert not wants_python_operator_overview("Types of operators in C++", "C++", "chat")
    assert not wants_python_operator_overview("Types of operators in Python", "Python", "hint")


def test_incomplete_ollama_answer_is_replaced_by_full_offline_guide():
    partial = "Only arithmetic, comparison, assignment and logical operators exist."
    enriched = ensure_operator_coverage(partial, "Types of Operators in Python", "Python", "chat")
    assert enriched == PYTHON_OPERATOR_GUIDE
    assert "bitwise" in enriched.lower() and "membership" in enriched.lower() and "identity" in enriched.lower()


def test_complete_answer_is_preserved():
    complete = ("Arithmetic, comparison, assignment, logical, bitwise, membership, and identity. "
                + "Here are examples, use cases, and details. " * 35)
    assert ensure_operator_coverage(complete, "Types of Operators in Python", "Python", "chat") == complete


def test_other_language_remains_untouched():
    assert ensure_operator_coverage("C++ has different operators", "Operators in C++", "C++", "chat") == "C++ has different operators"


def test_chat_asks_for_deep_guidance_and_increases_reply_budget(monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    captured = {}
    def fake_request(path, payload=None, timeout=3):
        captured.update(payload)
        return {"message": {"content": "Arithmetic, comparison, assignment, logical, bitwise, membership, identity"}}
    monkeypatch.setattr(ollama_client, "_request", fake_request)
    ollama_client.chat("llama3.2:3b", "chat", "Types of Operators in Python", "", "Python", [])
    assert captured["options"]["num_predict"] >= 1400
    assert captured["options"]["num_ctx"] >= 4096
    assert all(family.lower() in captured["messages"][0]["content"].lower() for family in PYTHON_OPERATOR_FAMILIES)


def test_hint_mode_keeps_socratic_style_and_short_budget(monkeypatch):
    monkeypatch.setattr(ollama_client, "installed_models", lambda: ["llama3.2:3b"])
    captured = {}
    def fake_request(path, payload=None, timeout=3):
        captured.update(payload)
        return {"message": {"content": "Try checking the loop condition first."}}
    monkeypatch.setattr(ollama_client, "_request", fake_request)
    ollama_client.chat("llama3.2:3b", "hint", "Help with loops", "", "Python", [])
    assert "Socratic" in captured["messages"][0]["content"]
    assert captured["options"]["num_predict"] < 1000
