# Syntax-Sensei — Phase 1: The Foundation

**An offline-first AI coding assistant and programming-learning platform for Visual Studio Code.**

> Phase 1 is a working **extension foundation and learning preview**, not the full finished AI assistant. It includes a React dashboard, a Python FastAPI local backend, SQLite lesson-progress storage, three short Python preview lessons, basic navigation, and automated tests. The AI features, full courses, quizzes and exams are clearly marked for later phases.

## Project stack

- VS Code extension host: **TypeScript / VS Code Extension API**
- Dashboard: **React 18 / Vite 6.4 / CSS**
- Local backend: **Python 3.12 / FastAPI / Uvicorn**
- Persistence: **SQLite (Python standard library)**
- Planned for Phase 2: **Ollama** (`llama3.2:3b` is a suitable first model for the reference system)
- Tests: **Pytest / Vitest / TypeScript**

## Start here on Windows

**Full Windows guide:** [`docs/INSTALL_WINDOWS.md`](docs/INSTALL_WINDOWS.md)

**Phase 1 build fix and E-drive migration:** [`docs/FIX01_MIGRATE_E_DRIVE.md`](docs/FIX01_MIGRATE_E_DRIVE.md)

In brief, after extracting the ZIP into a parent folder so that the project folder is `Syntax-Sensei`:

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
code .
```

Open this project in VS Code, press **F5**, wait for the **Extension Development Host** window, then click the Syntax-Sensei icon in the **Activity Bar**. The extension automatically launches the Python backend using the project's `.venv`. Alternatively, open the Command Palette and run `Syntax-Sensei: Open Learning Dashboard`.

**If you need to inspect errors:** VS Code → View → Output → choose **Syntax-Sensei** from the channel dropdown. See [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

## Phase 1 capabilities — working by design

1. Open Syntax-Sensei as a sidebar webview.
2. Launch a larger React learning dashboard from the Command Palette.
3. Automatically start a local Python FastAPI backend from the extension.
4. Show backend connection state and available learning preview lessons.
5. Read three introductory Python lessons.
6. Mark a lesson completed / undo its completion, persisted in SQLite.
7. Reopen the extension and retain saved progress.
8. Inspect logs and run automated API and dashboard logic tests.

**Not implemented in Phase 1:** AI inference/chat, code explanation, debugging, quizzes, chapter tests, full curriculum, compiler execution, certificates and remote sync. The sidebar's planned feature labels are not functional placeholders.

## Local API (optional manual smoke test)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-backend.ps1
```

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8765/health
Invoke-RestMethod http://127.0.0.1:8765/api/bootstrap
```

Stop the manual server using `Ctrl+C`. **Do not use this manual server to test the extension's database**; the extension starts its own server and uses VS Code's private extension storage. Manual runs default to `%USERPROFILE%\.syntax-sensei\progress.sqlite3`.

## Folder structure

```text
Syntax-Sensei/
├── .vscode/            # F5 launch and build task
├── backend/
│   ├── app/            # FastAPI, SQLite, preview lessons
│   ├── tests/          # Pytest API tests
│   └── requirements.txt
├── src/extension/      # VS Code TypeScript host code
├── webview/src/        # React UI + progress unit tests
├── media/              # VS Code Activity Bar icon
├── scripts/            # PowerShell setup/test/manual backend
├── docs/               # Windows install, acceptance, troubleshooting
├── package.json
└── vite.config.ts
```

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm test
npm run build
```

Before marking the phase accepted, complete every required manual test in [`docs/PHASE1_ACCEPTANCE.md`](docs/PHASE1_ACCEPTANCE.md). **An unchecked test is not yet accepted.** Please report unchecked items, your observed behavior, any terminal error logs, and screenshots together.

## GitHub: initial push (after the tests pass)

This repository is already created on GitHub under `Nobelesse`, so **do not create another GitHub repository**.

```powershell
git init
git branch -M main
git add .
git commit -m "Phase 1: VS Code extension foundation"
git remote add origin https://github.com/Nobelesse/Syntax-Sensei.git
git push -u origin main
```

If Git says you have not configured your identity, run these once with your own name/email:

```powershell
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR_GITHUB_COMMIT_EMAIL"
```

Don't push `.venv`, `node_modules`, or local databases — they are ignored by `.gitignore`. After pushing, open <https://github.com/Nobelesse/Syntax-Sensei> and confirm the commit and source folders.

## Project plan

- **Phase 1:** Extension, local API, SQLite, interactive learning preview.
- **Phase 2:** Ollama and local model selection.
- **Phase 3:** Code explanation, diagnostics and smart hints.
- **Phase 4:** Full language-learning curriculum and rich notes.
- **Phase 5:** Topic quizzes, question bank, result review.
- **Phase 6:** Chapter tests and comprehensive examinations.
- **Phases 7–10:** Controlled language execution, analytics, personal revision and release hardening.

## Security, privacy and offline limitations

The Phase 1 API binds to **127.0.0.1** on an automatically selected local port and isn't exposed to the network. The webview communicates through VS Code message passing, not arbitrary remote scripts. The local app does not collect cloud telemetry or call hosted AI services.

Initial `pip install` and `npm install` require internet access to download dependencies. Runtime can work offline after dependencies have been installed. The local API in Phase 1 is a learning-only prototype without an authentication layer; it should not be exposed outside localhost or used to execute untrusted code. Database storage for the extension is managed by VS Code's `globalStorageUri`.

## About packaging

The **development workflow (F5)** is the tested target for Phase 1. A future polished `.vsix` release will include Python-environment onboarding; at present, a standalone VSIX may require additional configuration for backend dependencies. Do not treat Phase 1 as a fully distributable Marketplace release.

## License

No open-source license has been selected yet. The repository can be public, but that alone does not grant an open-source license. Decide licensing before distributing/publishing a production release.
