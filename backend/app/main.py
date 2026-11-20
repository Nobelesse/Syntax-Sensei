"""Syntax-Sensei Phase 2 local API: learning foundation plus offline Ollama."""

from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from . import ollama_client
from .content import LESSONS, LESSON_IDS
from .database import completed_lesson_ids, initialize, set_completed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize()
    yield


app = FastAPI(
    title="Syntax-Sensei Local API", version="0.2.0",
    description="Offline-first coding mentor and programming education",
    lifespan=lifespan,
    docs_url=None, redoc_url=None, openapi_url=None,
)


class ProgressUpdate(BaseModel):
    completed: bool


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=3000)


class AIChatRequest(BaseModel):
    model: str = Field(min_length=1, max_length=120)
    mode: Literal["chat", "explain", "debug", "hint"] = "chat"
    prompt: str = Field(default="", max_length=5000)
    code: str = Field(default="", max_length=12000)
    language: str = Field(default="", max_length=60)
    history: list[ChatTurn] = Field(default_factory=list, max_length=8)


def progress_summary() -> dict:
    ids = completed_lesson_ids()
    return {"completed_ids": ids, "completed_count": len(ids), "total_lessons": len(LESSONS)}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "Syntax-Sensei", "version": "0.2.0"}


@app.get("/api/bootstrap")
def bootstrap() -> dict:
    return {
        "app": "Syntax-Sensei", "phase": 2,
        "description": "Offline-first learning and AI coding workspace",
        "lessons": LESSONS,
        "progress": progress_summary(),
        "features": {
            "learning_preview": "available",
            "local_progress": "available",
            "ai_chat": "available_local_ollama",
            "code_explanation": "available_local_ai_preview",
            "bug_assistance": "available_local_ai_preview",
            "guided_hints": "available_local_ai_preview",
            "full_courses": "planned_phase_4",
            "quizzes": "planned_phase_5",
        },
    }


@app.post("/api/lessons/{lesson_id}/progress")
def update_progress(lesson_id: str, data: ProgressUpdate) -> dict:
    if lesson_id not in LESSON_IDS:
        raise HTTPException(status_code=404, detail="Unknown lesson")
    set_completed(lesson_id, data.completed)
    return {"message": "Progress saved", "progress": progress_summary()}


@app.get("/api/ai/status")
def ai_status() -> dict:
    return ollama_client.status()


@app.post("/api/ai/chat")
def ai_chat(data: AIChatRequest) -> dict:
    try:
        return ollama_client.chat(
            model=data.model,
            mode=data.mode,
            prompt=data.prompt,
            code=data.code,
            language=data.language,
            history=[turn.model_dump() for turn in data.history],
        )
    except ollama_client.OllamaError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
