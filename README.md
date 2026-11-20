# Syntax-Sensei — Phase 2 (v0.2.0)

**Local AI coding mentor + programming learning foundation for VS Code.**

Current functionality: a VS Code sidebar and dashboard with three Python preview lessons, persistent SQLite lesson progress, a local FastAPI backend, plus Phase 2 Ollama chat, code explanations, bug assistance, and progressive hints.

## Technical stack

- VS Code Extension API + TypeScript, React 18 + Vite, Python FastAPI + SQLite, local Ollama (127.0.0.1:11434).
- No cloud LLM provider, telemetry or external API key.
- AI model weights must be installed locally. On 8 GB RAM and RTX 2050, start with already-installed `llama3.2:3b` or `llama3.2:1b` for faster responses. AI prompts are not stored in SQLite.

## Starting from the existing Phase 1 installation

The Phase 2 ZIP is an **upgrade patch**, not a fresh repository. It is installed with `install-phase2.ps1` from the extracted patch folder; see that ZIP's `README_INSTALL.md`. This preserves the existing SQLite database and Git history.

After applying the patch:

```powershell
Set-Location 'E:\Projects\Syntax-Sensei'
powershell -ExecutionPolicy Bypass -File .\scripts\test-phase2.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-ollama.ps1
code .
```

Press **F5** in the first VS Code window, then open `Syntax-Sensei: Open Learning Dashboard` in the Extension Development Host. Click **AI Sensei**, refresh local models if necessary, select `llama3.2:3b`, and send your first question. Select code in an editor and run `Syntax-Sensei: Explain Selected Code` to prefill the explain mode; review the selection and press **Ask Sensei** to submit it.

## What this phase does not yet provide

No complete language curricula, quizzes, chapter exams, persistent AI chat, code execution, workspace-wide analysis, automatic file edits, or fully independent installed VSIX backend provisioning. AI output can be inaccurate; review it. Phase 3 and later address additional features.

## Docs

- `docs/PHASE2_ACCEPTANCE.md` — complete manual acceptance list
- `docs/PHASE2_TROUBLESHOOTING.md` — connectivity, performance, and recovery
- Existing Phase 1 docs remain in `docs/`.

Repository: https://github.com/Nobelesse/Syntax-Sensei
