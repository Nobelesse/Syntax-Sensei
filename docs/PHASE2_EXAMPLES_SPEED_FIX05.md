# Syntax-Sensei — Phase 2, Examples & Responsiveness Fix 05

**Target:** your accepted Phase 2 Improvement 04 source at `E:\Projects\Syntax-Sensei` (project manifest still v0.2.1). This is an additional **Phase 2 improvement**, not the start of Phase 3.

## Improvements

1. **Practical example policy.** For programming explanations, the AI is explicitly instructed to provide a self-contained fenced code example with a correct language label and *expected* output, explain important lines, and avoid claiming it actually executed the code. Applies to Python, Java, C, C++, R, JS and other supported prompts. This is still a local LLM: verify generated examples before relying on them. The offline Python operators reference guide from Fix 04 remains.
2. **Answer depth.** The AI Sensei page now offers **Quick** (550 output tokens), **Balanced** (1,150 output tokens, default in UI), and **Detailed** (1,900 output tokens). Detailed is useful for broad topics, but slower. Hints remain short without revealing complete solutions.
3. **Progressive replies.** The extension displays the Markdown answer as Ollama generates it instead of waiting for every token. Python streams through a localhost FastAPI SSE endpoint to the VS Code extension, which batches updates before sending them to the webview. The previous non-streaming API route remains available.
4. **First-use model preparation.** Entering AI Sensei triggers an *asynchronous* warm-up request for the selected installed model, using Ollama's empty-prompt `/api/generate` call. This can overlap model loading with the time the user spends writing a question. The model is retained for five minutes to help with subsequent questions; it may consume RAM/VRAM during this time. A warm-up failure does not disable chat.
5. **Existing behavior preserved.** Question map, Markdown formatting, local model selector, four AI modes, code copy buttons, SQLite lesson progress and Git repository remain in place. Prompts and local model responses are not sent to cloud services by the patch. Chat remains session-only.

**No speed guarantee:** First response latency depends on model loading, prompt size, answer length, your CPU/GPU, and what else is running on the PC. Progressive display improves *time to visible text* once generation starts; it doesn't make Ollama generate tokens faster. Quick mode may save time because it produces fewer tokens. Preloading will not shorten a reply already being generated.

## Install

1. Close the VS Code Extension Development Host. Save `Syntax-Sensei-Phase-02-Examples-Speed-Fix-05.zip` to Downloads.
2. Extract the ZIP to a separate folder, then run the included installer. It checks exact expected source hashes (ignoring Windows line endings), stops if it sees unknown edits, backs up changed files under `E:\Projects\Syntax-Sensei-backups`, and applies only files from this update. No npm reinstall or Git reinitialization is needed.

```powershell
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-02-Examples-Speed-Fix-05.zip" -DestinationPath "E:\Projects\Syntax-Sensei-Phase-02-Speed-Package" -Force
Set-Location "E:\Projects\Syntax-Sensei-Phase-02-Speed-Package\Syntax-Sensei-Phase-02-Examples-Speed-Fix-05"
powershell -ExecutionPolicy Bypass -File .\install-fix.ps1
```

## Automated verification

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
powershell -ExecutionPolicy Bypass -File .\scripts\test-phase2.ps1
npm run build
npm audit
npx --no-install vsce ls
```

Target **28 Python backend tests** (previous 21 plus seven new tests), **11 React/Vitest tests** (unchanged), successful TypeScript/Vite builds, zero npm audit findings, and VSCE file list without errors. The existing Python dependency deprecation warning may still appear; it is not a failing test.

## Manual acceptance in VS Code

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
code .
```

Press F5 in the original VS Code window. In Extension Development Host open **Syntax-Sensei: Open Learning Dashboard** then **AI Sensei**.

- **Learning examples:** Ask `Explain recursion in Python with a runnable example and expected output`, then `Explain inheritance in Java`, and `Explain vectors in R with examples`. Verify each answer includes relevant code with understandable line-by-line guidance. Test compilation/execution separately where your local language toolchains are installed. Do not mark this pass solely because code appears — it should be correct and understandable.
- **Balanced:** Choose Balanced and ask `Types of operators in Python`. Confirm seven common families via the local guide and correct code examples.
- **Quick:** Switch to Quick and ask `Show a Python for loop with expected output`. Compare completion time to Balanced, noting the questions and warm/cold model state.
- **Detailed:** Ask `Explain different kinds of functions in Python with complete examples` and expect a longer answer.
- **Streaming:** A new answer should start appearing gradually while generation continues, then become a complete Markdown answer with working Copy Code and Copy Answer. A connection interruption should show an error and preserve the partial answer marked incomplete.
- **Preload:** Enter AI Sensei with Ollama running. Status may show `Preparing selected model ...`; if loading succeeds, it becomes `Selected model is prepared ...`. Model preparation may take time on first use. Try `ollama ps` to see loaded model residency.
- **Regression:** Question navigation, model switching, Explain Code, Debug, Hints, lesson completion and SQLite progress must still work.

## Troubleshooting

- **Installer reports changed file:** Send that error and do not overwrite it. The source hash guard protects changes made outside the patch.
- **No streaming text:** Run `npm run build`, restart the Extension Development Host, and inspect **Output → Syntax-Sensei** plus **Help → Toggle Developer Tools → Console**. Do not open `dist/webview/index.html` directly in Chrome.
- **Model preparation failed:** Ollama may be stopped or your PC may be memory-constrained. Chat may still work; try Quick mode and `llama3.2:1b`, or ask for help with the logs.
- **Answer too short:** Select Detailed. The LLM might still omit cases; continue asking focused follow-up questions. The app doesn't claim perfect coverage.
- **Partial interrupted answer:** Review the displayed error and retry. An interrupted response is explicitly marked incomplete.
- **npm installation:** No new npm packages needed; existing v0.2.1 dependencies remain.
- **Rollback:** The installer prints a backup path. Run the included `rollback-fix.ps1` with `-BackupPath "E:\Projects\Syntax-Sensei-backups\phase-02-examples-speed-05-..."`, then `npm run build`. This restores only files affected by this update; Git changes, installed models, DB and app data aren't touched.

## GitHub push (only after tests and your visual acceptance pass)

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
git status
git add backend/app/ollama_client.py backend/app/main.py backend/tests/test_response_speed.py
git add src/extension/backend.ts src/extension/panel.ts
git add webview/src/main.tsx webview/src/style.css docs/PHASE2_EXAMPLES_SPEED_FIX05.md
git diff --cached --check
git diff --cached --stat
git commit -m "Improve Phase 2 code examples and live Ollama responses"
git push origin main
git status
```

Verify at `https://github.com/Nobelesse/Syntax-Sensei`. Do not commit `.venv`, `node_modules`, SQLite DB, or local logs.
