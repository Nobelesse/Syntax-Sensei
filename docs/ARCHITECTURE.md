# Syntax-Sensei Phase 1 architecture

## Process and data flow

```text
VS Code extension host (TypeScript)
  ├── Registers Activity Bar icon and open-dashboard command
  ├── Renders React/Vite compiled Webview resources (restricted CSP)
  ├── Receives typed messages from dashboard
  └── BackendManager
       ├── Chooses Python from project .venv (or configured path)
       ├── Reserves an ephemeral local port on 127.0.0.1
       ├── Starts uvicorn backend.app.main:app as a subprocess
       ├── Waits for /health
       └── Proxies known API routes using Node's http module
            └── Python FastAPI backend
                 ├── GET /health
                 ├── GET /api/bootstrap
                 ├── POST /api/lessons/{id}/progress
                 ├── Reviewed Python preview lesson content
                 └── SQLite progress storage
```

The webview does **not** access the Python service directly. The extension host owns backend lifetime and API requests. HTTP calls are restricted to predetermined routes and loopback address only.

## Backend modules

- `main.py` — FastAPI endpoint definitions and request model.
- `content.py` — curated three-lesson preview.
- `database.py` — SQL parameterized persistence and filesystem setup.
- `tests/test_api.py` — application and persistence tests.

SQLite database location for extension mode: `context.globalStorageUri/progress.sqlite3` (specific folder managed by VS Code). When the manual backend starts independently, it defaults to `%USERPROFILE%\.syntax-sensei\progress.sqlite3`.

## Extension modules

- `extension.ts` — activation, commands, lifecycle, output.
- `panel.ts` — sidebar/full panel, CSP, webview message routing.
- `backend.ts` — process launcher, local API client, log output.

## UI

- `webview/src/main.tsx` — navigation, interactive preview, progress view, future milestones.
- `webview/src/progress.ts` — typed API payload and progress helpers.
- `webview/src/style.css` — responsive dark dashboard.

The `npm run build` script compiles the extension into `dist/extension` and the React UI into `dist/webview`. VS Code reads these build outputs in the F5 Extension Development Host.

## Planned evolution

Phase 2 introduces an Ollama adapter behind new backend endpoints, never directly inside the webview. Phase 3 adds editor selection and diagnostic handlers in the extension host. Phase 4 introduces a versioned course/lesson database schema and curated learning content. Phase 5–6 introduces question banks, quizzes, practice scoring, assessments, and per-topic progress. Future code execution needs strict user consent and bounded local tooling. None of those future features is implemented in Phase 1.

## Honest limitations

- No Ollama usage until Phase 2.
- No fully packaged, auto-installing backend environment in VSIX yet.
- No password storage, telemetry, cloud sync, or account system.
- Loopback HTTP is acceptable for a low-risk preview service but is **not** a future security boundary for arbitrary code execution. Sensitive APIs should require stronger authorization.
