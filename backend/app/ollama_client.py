"""Loopback-only Ollama adapter; no cloud service, auto-download, or code execution.

The adapter connects directly to 127.0.0.1:11434 instead of accepting arbitrary URLs.
Supports both the original non-streaming API and streaming token delivery.
"""

from __future__ import annotations

import http.client
import json
import socket
from typing import Any, Iterator

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
    if path not in ("/api/tags", "/api/chat", "/api/generate"):
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


CODE_EXAMPLES_POLICY = (
    "When the user is learning a programming concept, provide at least one practical, "
    "complete fenced code example with the correct language label (python, java, c, cpp, r, javascript, etc.). "
    "Use runnable, self-contained examples where practical: include necessary imports, classes, "
    "entry points, and input values; no unexplained placeholders. Explain important lines in simple words. "
    "Show the expected output in a separate text code fence and label it as expected, "
    "not as output you executed. For a broad topic, demonstrate important categories with short "
    "examples, not a giant program; avoid filler. For debugging, show a corrected snippet with "
    "an explanation and expected behavior. For hint mode do NOT reveal a complete solution unless asked. "
    "If code would be misleading or irrelevant (e.g. a conceptual policy question), say why. "
)
DEPTH_TOKENS = {"quick": 550, "balanced": 1150, "detailed": 1900}
KEEP_ALIVE = "5m"  # Shorter retention is friendlier to 8 GB machines.


def warmup(model: str) -> dict[str, str]:
    """Preload a locally installed model with no user prompt, on a separate API request."""
    if model not in installed_models():
        raise OllamaError("Select an installed model before preparing it.", 400)
    _request("/api/generate", {"model": model, "prompt": "", "stream": False,
                               "keep_alive": KEEP_ALIVE}, timeout=120)
    return {"model": model, "state": "ready"}


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


def prepare_chat(
    model: str, mode: str, prompt: str, code: str, language: str,
    history: list[dict[str, str]], depth: str = "detailed",
) -> dict[str, Any]:
    """Shared prompt builder for streaming and legacy response routes."""
    models = installed_models()
    if model not in models:
        raise OllamaError("Model isn't installed locally. Refresh and select an installed model.", 400)
    if mode not in SYSTEM_INSTRUCTIONS:
        raise OllamaError("Unknown AI assistance mode.", 400)
    if depth not in DEPTH_TOKENS:
        raise OllamaError("Unknown answer-depth setting.", 400)
    if not prompt.strip() and not code.strip():
        raise OllamaError("Enter a question or code before asking Sensei.", 400)
    if mode in ("explain", "debug") and not code.strip():
        raise OllamaError("Paste or select code for this mode.", 400)
    system = (
        "You are Syntax-Sensei, a helpful offline coding mentor. "
        "Never claim to have accessed files, executed programs, searched online, or verified outputs. "
        "Use clear Markdown headings, lists, tables when helpful, and fenced code blocks with language labels. "
        "Answer accurately and acknowledge uncertainty; don't claim literal completeness. "
        + SYSTEM_INSTRUCTIONS[mode] + " " + CODE_EXAMPLES_POLICY
    )
    if depth == "quick":
        system += "\nKeep the response focused: a concise explanation, one practical code example, expected output and a tip."
    elif depth == "detailed":
        system += "\nUse enough detail for independent study, with examples for major cases and related topics."
    else:
        system += "\nBe thorough but efficient: focus on essential explanations and useful runnable examples."
    if wants_python_operator_overview(prompt, language, mode):
        system += (
            "\nFor an overview of Python operator types, include ALL SEVEN conventional categories: "
            "arithmetic, comparison (relational), assignment, logical, bitwise, membership, and identity. "
            "Explain / vs //, = vs ==, and vs &, == vs is, precedence, and :=. "
            "Include examples rather than only a list."
        )
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if mode == "chat":
        messages.extend(history[-8:])
    text = (f"Language: {language}\n\n" if language else "")
    if code.strip():
        text += f"CODE:\n```\n{code.strip()}\n```\n\n"
    text += f"QUESTION:\n{prompt.strip()}" if prompt.strip() else "Explain the code clearly."
    messages.append({"role": "user", "content": text})
    budget = 400 if mode == "hint" else DEPTH_TOKENS[depth]
    return {"model": model, "messages": messages, "stream": False,
            "options": {"temperature": 0.2, "num_ctx": 4096, "num_predict": budget},
            "keep_alive": KEEP_ALIVE}


def chat(model: str, mode: str, prompt: str, code: str, language: str,
         history: list[dict[str, str]], depth: str = "detailed") -> dict[str, str]:
    """Legacy non-streaming route remains available for compatibility."""
    payload = prepare_chat(model, mode, prompt, code, language, history, depth)
    response = _request("/api/chat", payload, timeout=180)
    message = response.get("message")
    answer = message.get("content") if isinstance(message, dict) else None
    if not isinstance(answer, str) or not answer.strip():
        raise OllamaError("The model returned an empty response. Try again or choose another model.")
    return {"model": model, "mode": mode,
            "reply": ensure_operator_coverage(answer.strip(), prompt, language, mode)}


def _stream_ollama(payload: dict[str, Any]) -> Iterator[str]:
    """Parse Ollama's newline-delimited JSON safely; never accept remote URLs."""
    connection = http.client.HTTPConnection(HOST, PORT, timeout=180)
    try:
        raw_payload = json.dumps({**payload, "stream": True}).encode("utf-8")
        connection.request("POST", "/api/chat", body=raw_payload,
                           headers={"Content-Type": "application/json"})
        response = connection.getresponse()
        if response.status >= 400:
            if response.status == 404:
                raise OllamaError("Model not found. Refresh installed models.", 404)
            raise OllamaError(f"Local Ollama returned HTTP {response.status}.", 502)
        total_bytes = 0
        done = False
        while True:
            line = response.readline(MAX_BODY_BYTES + 1)
            if not line:
                break
            total_bytes += len(line)
            if total_bytes > MAX_BODY_BYTES:
                raise OllamaError("Ollama streamed response exceeded size limit.", 502)
            if not line.strip():
                continue
            try:
                event = json.loads(line.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise OllamaError("Ollama sent an invalid streaming response.") from exc
            if not isinstance(event, dict):
                raise OllamaError("Ollama sent invalid stream data.")
            if event.get("error"):
                raise OllamaError("Ollama generation failed: " + str(event["error"])[:200])
            message = event.get("message")
            text = message.get("content") if isinstance(message, dict) else None
            if isinstance(text, str) and text:
                yield text
            if event.get("done") is True:
                done = True
                break
        if not done:
            raise OllamaError("Ollama ended the stream before completing its answer.")
    except (ConnectionRefusedError, OSError) as exc:
        if isinstance(exc, (socket.timeout, TimeoutError)):
            raise OllamaError("Ollama response timed out. Use Quick mode or a smaller model.", 504) from exc
        raise OllamaError("Ollama is unavailable on 127.0.0.1:11434.", 503) from exc
    finally:
        connection.close()


def stream_chat(model: str, mode: str, prompt: str, code: str, language: str,
                history: list[dict[str, str]], depth: str = "detailed") -> Iterator[dict[str, str]]:
    """Validate before streaming begins; emit a complete final reply for the UI."""
    payload = prepare_chat(model, mode, prompt, code, language, history, depth)

    def generate() -> Iterator[dict[str, str]]:
        answer_parts: list[str] = []
        for token in _stream_ollama(payload):
            answer_parts.append(token)
            yield {"type": "chunk", "text": token}
        answer = "".join(answer_parts).strip()
        if not answer:
            raise OllamaError("The model returned an empty response. Try again or choose another model.")
        yield {"type": "done", "model": model, "mode": mode,
               "reply": ensure_operator_coverage(answer, prompt, language, mode)}

    return generate()
