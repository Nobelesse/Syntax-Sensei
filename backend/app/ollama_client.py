"""Loopback-only Ollama adapter; no cloud service, auto-download, or code execution.

The adapter connects directly to 127.0.0.1:11434 instead of accepting arbitrary URLs.
Chat requests deliberately use non-streaming responses in Phase 2.
"""

from __future__ import annotations

import http.client
import json
import socket
from typing import Any

from .teaching_guides import ensure_operator_coverage, wants_python_operator_overview

HOST = "127.0.0.1"
PORT = 11434
MAX_BODY_BYTES = 2_000_000
PREFERRED_MODEL = "llama3.2:3b"


class OllamaError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _request(path: str, payload: dict[str, Any] | None = None, timeout: int = 3) -> dict[str, Any]:
    if path not in ("/api/tags", "/api/chat"):
        raise OllamaError("Unsupported Ollama API path", 400)
    connection = http.client.HTTPConnection(HOST, PORT, timeout=timeout)
    try:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        connection.request(
            "POST" if body is not None else "GET",
            path,
            body=body,
            headers={"Content-Type": "application/json"} if body is not None else {},
        )
        response = connection.getresponse()
        # Bound the response to avoid untrusted Ollama data exhausting memory.
        raw = response.read(MAX_BODY_BYTES + 1)
        if len(raw) > MAX_BODY_BYTES:
            raise OllamaError("Ollama response is too large.", 502)
        if response.status >= 400:
            if response.status == 404:
                raise OllamaError("Selected Ollama model was not found. Refresh models and try again.", 404)
            raise OllamaError(f"Local Ollama returned HTTP {response.status}.", 502)
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data, dict):
            raise OllamaError("Unexpected response from local Ollama.")
        return data
    except (ConnectionRefusedError, OSError) as exc:
        if isinstance(exc, socket.timeout) or isinstance(exc, TimeoutError):
            raise OllamaError("Ollama response timed out. Try a smaller local model.", 504) from exc
        raise OllamaError("Ollama is unavailable on 127.0.0.1:11434. Start Ollama and retry.", 503) from exc
    except json.JSONDecodeError as exc:
        raise OllamaError("Ollama returned invalid JSON.") from exc
    finally:
        connection.close()


def installed_models() -> list[str]:
    data = _request("/api/tags")
    models = data.get("models", [])
    if not isinstance(models, list):
        raise OllamaError("Ollama model list is invalid.")
    names: list[str] = []
    for model in models:
        if isinstance(model, dict) and isinstance(model.get("name"), str):
            name = model["name"].strip()
            if name and name not in names:
                names.append(name)
    return names


def status() -> dict[str, Any]:
    try:
        names = installed_models()
    except OllamaError as error:
        return {"online": False, "models": [], "preferred_model": None, "message": str(error)}
    preferred = PREFERRED_MODEL if PREFERRED_MODEL in names else (names[0] if names else None)
    return {
        "online": True,
        "models": names,
        "preferred_model": preferred,
        "message": "Ollama connected. All AI requests stay on this computer." if names
        else "Ollama is online, but no local models are installed. Run ollama list to check.",
    }


SYSTEM_INSTRUCTIONS = {
    "chat": (
        "Teach the requested programming topic like a careful instructor. Start with a direct definition, "
        "then explain why it matters, syntax, ALL major recognized categories or variants, "
        "how each works, small commented code examples and their expected results, practical use cases, "
        "common mistakes and edge cases, connections to relevant language concepts, and a short recap "
        "with 2-3 review questions. Explain beginner concepts in simple language before jargon. "
        "Do not arbitrarily limit an overview to 3 or 4 types when more standard types exist. "
        "If the user asks a narrow question, focus on that question rather than a full course. "
        "Clearly distinguish verified facts from uncertain suggestions. Prefer thoroughness over brevity."
    ),
    "explain": "Explain the provided code step by step. Clarify syntax, inputs, outputs and any assumptions. Do not claim you ran it.",
    "debug": "Review the provided code for possible bugs. Distinguish confirmed issues from hypotheses, give reasoning and proposed corrections. Do not claim to have executed the code.",
    "hint": "Act as a Socratic programming tutor. Give small progressive hints; do not reveal the full solution unless specifically requested.",
}


def chat(
    model: str,
    mode: str,
    prompt: str,
    code: str,
    language: str,
    history: list[dict[str, str]],
) -> dict[str, str]:
    models = installed_models()
    if model not in models:
        raise OllamaError("Model isn't installed locally. Refresh the model list and select an installed model.", 400)
    if mode not in SYSTEM_INSTRUCTIONS:
        raise OllamaError("Unknown AI assistance mode.", 400)
    if not prompt.strip() and not code.strip():
        raise OllamaError("Enter a question or code before asking Sensei.", 400)
    if mode in ("explain", "debug") and not code.strip():
        raise OllamaError("Paste or select code for this mode.", 400)
    system = (
        "You are Syntax-Sensei, a helpful offline coding mentor. "
        "Never claim to have accessed files, executed programs, searched online, or verified outputs. "
        "Use clear Markdown headings, lists, tables when helpful, and fenced code blocks with language labels. "
        "Answer accurately and acknowledge uncertainty; do not claim to cover literally everything. "
        + SYSTEM_INSTRUCTIONS[mode]
    )
    if wants_python_operator_overview(prompt, language, mode):
        system += (
            "\nFor an overview of Python operator types, include ALL SEVEN conventional categories: "
            "arithmetic, comparison (relational), assignment, logical, bitwise, membership, and identity. "
            "Explain important distinctions: / vs //, = vs ==, and vs &, == vs is, "
            "membership in collections, precedence, and the := assignment expression. "
            "Provide examples rather than just a list."
        )
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if mode == "chat":
        # History is a limited window from the current webview session only.
        messages.extend(history[-8:])
    text = (f"Language: {language or 'not specified'}\n\n" if language else "")
    if code.strip():
        text += f"CODE:\n```\n{code.strip()}\n```\n\n"
    text += f"QUESTION:\n{prompt.strip()}" if prompt.strip() else "Explain the code clearly."
    messages.append({"role": "user", "content": text})
    response = _request(
        "/api/chat",
        {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.2, "num_ctx": 4096, "num_predict": 700 if mode == "hint" else 1700},
            "keep_alive": "2m",
        },
        timeout=180,
    )
    message = response.get("message")
    answer = message.get("content") if isinstance(message, dict) else None
    if not isinstance(answer, str) or not answer.strip():
        raise OllamaError("The model returned an empty response. Try again or choose another model.")
    return {"model": model, "mode": mode, "reply": ensure_operator_coverage(answer.strip(), prompt, language, mode)}
