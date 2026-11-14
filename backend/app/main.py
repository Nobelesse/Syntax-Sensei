"""Syntax-Sensei Phase 1 local API. No remote services or AI inference yet."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .content import LESSONS, LESSON_IDS
from .database import completed_lesson_ids, initialize, set_completed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize()
    yield


app = FastAPI(
    title="Syntax-Sensei Local API", version="0.1.0",
    description="Offline-first foundations for programming education",
    lifespan=lifespan,
    docs_url=None, redoc_url=None, openapi_url=None,
)


class ProgressUpdate(BaseModel):
    completed: bool


def progress_summary() -> dict:
    ids = completed_lesson_ids()
    return {"completed_ids": ids, "completed_count": len(ids), "total_lessons": len(LESSONS)}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "Syntax-Sensei", "version": "0.1.0"}


@app.get("/api/bootstrap")
def bootstrap() -> dict:
    return {
        "app": "Syntax-Sensei", "phase": 1,
        "description": "Offline-first learning and coding workspace",
        "lessons": LESSONS,
        "progress": progress_summary(),
        "features": {
            "learning_preview": "available",
            "local_progress": "available",
            "ai_chat": "planned_phase_2",
            "code_explanation": "planned_phase_3",
            "full_courses": "planned_phase_4",
            "quizzes": "planned_phase_5"
        }
    }


@app.post("/api/lessons/{lesson_id}/progress")
def update_progress(lesson_id: str, data: ProgressUpdate) -> dict:
    if lesson_id not in LESSON_IDS:
        raise HTTPException(status_code=404, detail="Unknown lesson")
    set_completed(lesson_id, data.completed)
    return {"message": "Progress saved", "progress": progress_summary()}
