"""Local-first SQLite persistence for completed preview lessons."""

import os
from pathlib import Path
import sqlite3
from datetime import datetime, timezone


def database_path() -> Path:
    custom = os.environ.get("SYNTAX_SENSEI_DB_PATH")
    return Path(custom) if custom else Path.home() / ".syntax-sensei" / "progress.sqlite3"


def connect() -> sqlite3.Connection:
    db_file = database_path()
    db_file.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(db_file), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA busy_timeout = 10000")
    return connection


def initialize() -> None:
    with connect() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS lesson_progress (
                lesson_id TEXT PRIMARY KEY,
                completed_at TEXT NOT NULL
            )
        """)
        connection.commit()


def completed_lesson_ids() -> list[str]:
    with connect() as connection:
        return [str(row["lesson_id"]) for row in connection.execute(
            "SELECT lesson_id FROM lesson_progress ORDER BY lesson_id"
        )]


def set_completed(lesson_id: str, completed: bool) -> None:
    with connect() as connection:
        if completed:
            now = datetime.now(timezone.utc).isoformat()
            connection.execute(
                "INSERT INTO lesson_progress (lesson_id, completed_at) VALUES (?, ?) "
                "ON CONFLICT(lesson_id) DO UPDATE SET completed_at = excluded.completed_at",
                (lesson_id, now),
            )
        else:
            connection.execute("DELETE FROM lesson_progress WHERE lesson_id = ?", (lesson_id,))
        connection.commit()
