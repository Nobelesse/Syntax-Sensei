# Phase 1 — Troubleshooting guide

## Where to find errors

- **VS Code extension output:** In the Extension Development Host → **View → Output** → choose **Syntax-Sensei**.
- **TypeScript build errors:** In the original VS Code window → Terminal running `npm run build`.
- **Python API tests:** In terminal running `.\.venv\Scripts\python.exe -m pytest backend\tests -q`.
- **Webview errors:** Development Host → Help → Toggle Developer Tools → Console.

## Fixed issue: TS2769 Vite/Vitest plugin type conflict

Original Phase 1 used Vite 6 with Vitest 2, which pulled incompatible Vite type declarations. Apply the Phase 1 fix overlay and run `npm install`, then `npm run build` and `npm test`. The repaired version uses Vite 6.4.6, Vitest 3.2.4, and separates `vite.config.ts` from `vitest.config.ts`.

If errors remain, run `npm ls vite vitest` to check for duplicate Vite versions. Do not blindly run `npm audit fix --force` because it can introduce breaking changes; share `npm audit` results for a reviewed dependency update.

## Setup failures

| Symptom | What to try |
|---|---|
| `python` not recognized | Verify Python installation and PATH using `python --version`; use absolute path if needed. |
| `npm` not recognized | Install/reconfigure Node.js; open a new terminal. |
| `Failed to fetch` during pip/npm install | Connect to the internet during initial installation and retry; offline runtime comes after install. |
| `running scripts is disabled on this system` | Use `powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1` in a new shell, or run the manual commands. |
| `No module named uvicorn` | Confirm `backend/requirements.txt` installed into **the project's `.venv`**, not another Python interpreter. |
| `Syntax-Sensei UI not built` | Run `npm run build` from project root, then reload the Extension Development Host. |
| `Backend ... connection refused` | Inspect Output → Syntax-Sensei; verify the `.venv` exists and that Python dependencies installed. Use `Syntax-Sensei: Check Backend Connection`. |
| `The port 8765 is occupied` | Only the optional manual backend uses 8765; the extension uses a random local port. Stop the manual API or use another free test port. |
| `git remote origin already exists` | Check `git remote -v`. If it points to the expected repository, do not add it again. |
| `Author identity unknown` | Set your own `git config --global user.name` and `user.email` once. |
| GitHub auth failed | Sign in through Git's supported credential manager; never paste a PAT or password into ChatGPT. |

## Screenshot/error reporting

When an acceptance item is unchecked:

1. Leave it unchecked in the interactive checklist.
2. Write the test ID (e.g., `U4`) and what happened in the error-description section.
3. Press **Copy Test Results** or **Copy Complete Phase Report**.
4. Paste that report into ChatGPT's message field.
5. Use the attachment option to add one or more screenshots or log files **before sending the same message**.

**Privacy:** Remove or blur any tokens, keys, passwords, private file paths or personal data that you do not want to share.
