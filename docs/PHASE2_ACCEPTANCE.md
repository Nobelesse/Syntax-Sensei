# Syntax-Sensei Phase 2 — Acceptance and diagnostics

Scope: Offline Ollama AI chat, local model list, explain code, bug assistance, hints, explicit editor-selection transfer, and preservation of Phase 1 features.

## A. Installation

- [ ] A1: Patch installed at `E:\Projects\Syntax-Sensei`
- [ ] A2: Backups saved under `E:\Projects\Syntax-Sensei-backups`
- [ ] A3: `package.json` and `package-lock.json` show 0.2.0
- [ ] A4: Existing `node_modules` and `.venv` remain functional

## B. Automated checks

- [ ] B1: Python tests including mocked Ollama pass (14 expected)
- [ ] B2: React progress tests pass (3 expected)
- [ ] B3: TypeScript and Vite build pass
- [ ] B4: `npm audit` reports zero vulnerabilities
- [ ] B5: `npx --no-install vsce ls` passes

## C. Local AI manual checks

- [ ] C1: Ollama app/service reachable at `127.0.0.1:11434`
- [ ] C2: `llama3.2:3b` appears under installed models
- [ ] C3: `F5` opens Extension Development Host
- [ ] C4: AI Sensei page opens and shows local connection/model
- [ ] C5: Ask Sensei answers a basic Python question
- [ ] C6: Explain Code explains pasted Python code
- [ ] C7: Find Possible Bugs describes a possible issue in example code
- [ ] C8: Progressive Hints gives a hint without immediately revealing full solution
- [ ] C9: Selecting code in editor + Syntax-Sensei: Explain Selected Code pre-fills code **without auto-sending**
- [ ] C10: Switching among installed models works (test only if a second model is already installed)
- [ ] C11: Stopping Ollama then refreshing produces a clear offline status (restart Ollama afterwards)

## D. Regression

- [ ] D1: All three original Python lessons present
- [ ] D2: Completion and undo work
- [ ] D3: Saved lesson progress survives extension restart
- [ ] D4: Visual appearance/navigation satisfactory

## E. GitHub

- [ ] E1: Review `git status`/`git diff --cached`
- [ ] E2: Commit Phase 2 files to existing repository
- [ ] E3: Push to `main` successfully
- [ ] E4: Updated v0.2.0 files visible on GitHub
- [ ] E5: `.venv`, `node_modules`, databases, tokens and secrets are not committed

## F. Final approval

- [ ] F1: All required tests pass (C10 may be not applicable if one local model)
- [ ] F2: User is satisfied with the features/UI
- [ ] F3: User explicitly approves completing Phase 2

## Errors and screenshots

Leave failed, untested, or unsatisfactory checks unchecked. Copy reports from ChatGPT, paste into a message, attach screenshots and terminal logs before sending. For backend errors: VS Code > View > Output > Syntax-Sensei. For UI errors: Extension Development Host > Help > Toggle Developer Tools > Console. Avoid sharing credentials or source code containing secrets.
