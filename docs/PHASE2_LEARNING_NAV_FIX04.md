# Phase 2 Improvement 04

# Syntax-Sensei — Phase 2 Learning Depth & Question Navigation Fix 04

**Targets:** approved Phase 2 with Markdown formatting fix v0.2.1 at `E:\Projects\Syntax-Sensei`.  Phase 2 is *not* accepted yet until its remaining UI check passes.

## Improvements

- Makes Ask Sensei behave more like a learning tutor: definition, all major categories, examples, errors, related topics, quick review questions. Narrow questions stay focused. Responses may take longer on 8 GB RAM because Ollama's output budget has been increased from 600 to 1,700 tokens (hint mode stays shorter) and context from 2,048 to 4,096.
- Includes one reviewed local study guide for **broad Python operators** questions covering seven standard families: arithmetic, comparison, assignment, logical, bitwise, membership, identity. If a small AI model gives an incomplete/too-short overview, the local reference is returned instead. Other subjects use improved prompting, but no local model can guarantee literally every detail on every topic.
- Adds a narrow vertical question map to the right edge of the Conversation card. Each line represents a **user question in this session**. Hover or keyboard-focus a line for a question preview near the top; click or press Enter to scroll the associated user question into view. A selected line is highlighted. Long lists scroll independently.
- Keeps markdown formatting, Copy Code, Copy Answer, Ollama model selector, Python lesson progress, and earlier Phase 2 features. No extra npm or Python dependencies.
- Chat remains **in memory only**: question map disappears when the webview reloads or chat is cleared, matching existing privacy behavior. Chat history isn't persisted across sessions in this fix.

## Install (Windows PowerShell)

Save ZIP in Downloads and close the Extension Development Host, then:

```powershell
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-02-Learning-Navigation-Fix-04.zip" -DestinationPath "E:\Projects\Syntax-Sensei-Phase-02-Learning-Navigation-Package" -Force
Set-Location "E:\Projects\Syntax-Sensei-Phase-02-Learning-Navigation-Package\Syntax-Sensei-Phase-02-Learning-Navigation-Fix-04"
powershell -ExecutionPolicy Bypass -File .\install-fix.ps1
```

Installer requires unchanged v0.2.1 target files. It backs up all affected original files under `E:\Projects\Syntax-Sensei-backups`, verifies their known source hashes ignoring line-ending differences, and aborts if it detects changes it doesn't recognize. The backup remains after installation. Running again is safe.

## Test

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
powershell -ExecutionPolicy Bypass -File .\scripts\test-phase2.ps1
npm run build
npm audit
npx --no-install vsce ls
code .
```

Test script targets **21 Python tests** (14 old + 7 new) and **11 frontend tests** (8 old + 3 new); tests run without real AI, then manually press F5 in the original VS Code project window.

## Manual acceptance

1. In Extension Development Host, open AI Sensei. Ensure Ollama is connected and model `llama3.2:3b` is selected.
2. Ask `Types of Operators in Python`. Expect all **seven** conventional families, with syntax, examples and notes about `is` vs `==`, assignment, and membership. The full offline reference is used if the model's answer is too brief.
3. Ask other questions (`Explain Python functions and their types`; `What are Python loops?`); expect a more detailed and structured response, but do not assume the model is infallible.
4. Ask at least **three** questions in the same chat, then hover over each small line in the right-hand *Question map*. The preview should show that earlier question. Click the first line and confirm the conversation scrolls to that user message; click another and verify it jumps correctly. Try Tab + Enter on the line for keyboard access.
5. Confirm formatted headings, lists, tables, Copy Code/Answer buttons, and Phase 1 lesson progress still work.
6. Restart the Extension Development Host and check lesson progress. Note that chat and the question map are intentionally session-only.

## GitHub (only after all acceptance tests pass)

```powershell
Set-Location "E:\Projects\Syntax-Sensei"
git status
git add backend/app/ollama_client.py backend/app/teaching_guides.py backend/tests/test_learning_depth.py
git add webview/src/main.tsx webview/src/style.css webview/src/questionNavigator.ts webview/src/questionNavigator.test.ts
git diff --cached --check
git diff --cached --stat
git commit -m "Improve Phase 2 teaching depth and conversation navigation"
git push origin main
git status
```

If the script fails, do not force-install or commit. Share its exact error text and a screenshot with the checklist. The package doesn't change package.json or package-lock.json; current version remains v0.2.1 until Phase 2 is finally accepted.
