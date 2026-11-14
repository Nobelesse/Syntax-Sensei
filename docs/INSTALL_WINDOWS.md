# Phase 1: Complete Windows setup and first Git push

These commands are for **Windows PowerShell** with Python 3.12.10, Node 22, npm 10, and Git already installed. The reference machine has 8 GB RAM and an NVIDIA RTX 2050 with 4 GB VRAM, which is more than enough for the extension foundation.

## A. E-drive installation and repair

**The project root is `E:\Projects\Syntax-Sensei`.** If migrating an already extracted Phase 1 project from `C:\Users\adity\Projects\Syntax-Sensei`, follow [`FIX01_MIGRATE_E_DRIVE.md`](FIX01_MIGRATE_E_DRIVE.md) instead of re-extracting the original ZIP. The fix overlay keeps your existing files and any Git metadata.

For a brand-new extraction only:

```powershell
New-Item -ItemType Directory -Force -Path "E:\Projects" | Out-Null
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-01.zip" -DestinationPath "E:\Projects"
Set-Location "E:\Projects\Syntax-Sensei"
```

Apply the latest fix overlay ZIP from the chat **before installing**.

## B. Install prerequisites and build

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

The setup script performs `python -m venv .venv`, installs Python requirements, runs `npm install`, then compiles the TypeScript extension and React webview. **Initial installation requires internet access**. This should not uninstall or change your global Python or Node packages.

Alternative manual steps if you prefer:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
npm install
npm run build
```

Expected: end message `Setup complete. Open this folder in VS Code and press F5.`

## C. Run automated tests

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
```

Alternative manual steps:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm test
npm run build
```

Expected: all Python tests, webview unit tests, TypeScript checks, and build pass. **Only check them off after they pass on your PC**.

## D. Launch in VS Code

```powershell
code .
```

If `code` is not recognized, open VS Code manually → **File → Open Folder** → `E:\Projects\Syntax-Sensei`.

In VS Code:

1. If prompted about trusting the folder, review it and trust your own extracted project.
2. Press **F5**, or Run and Debug → **Launch Syntax-Sensei**.
3. Wait for the new **Extension Development Host** window.
4. In the development host's Activity Bar (left), click the **Syntax-Sensei** graduation-cap-style icon.
5. Alternatively, press `Ctrl+Shift+P` → `Syntax-Sensei: Open Learning Dashboard`.
6. Look for `Connected` under **Backend Status** on the Overview page.
7. Open **Learn Python**, read a lesson, click **Mark lesson complete**.
8. Open **My Progress**; verify the count changes. Close and reopen the development host using **F5** from the original window and verify the check mark persists.

The local Python backend starts automatically when the dashboard requests data. You do **not** need to start a second manual server while using F5.

## E. Optional manual API smoke test

If the VS Code UI fails, test the backend independently:

**Terminal 1:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-backend.ps1
```

**Terminal 2:**
```powershell
Invoke-RestMethod http://127.0.0.1:8765/health
Invoke-RestMethod http://127.0.0.1:8765/api/bootstrap
```

Expected: health contains `status: ok`; bootstrap contains three Python preview lessons. Stop Terminal 1 with `Ctrl+C`. If port 8765 is occupied, inspect what process is using it rather than shutting down an unknown process.

## F. Fix failures before Git push

Complete `docs/PHASE1_ACCEPTANCE.md` and the interactive checklists in the ChatGPT delivery. **If any test is unchecked, send the copied checklist report + a screenshot or terminal log.** Wait for the corrected files or fix instructions; do not mark incomplete work as passed.

## G. First Git commit and push — existing Nobelesse repository

From the project root, after all required checks pass:

```powershell
git init
git branch -M main
git status
git add .
git commit -m "Phase 1: VS Code extension foundation"
git remote add origin https://github.com/Nobelesse/Syntax-Sensei.git
git push -u origin main
```

If Git prompts for authentication, sign in to your GitHub account through the supported Git credential flow. If `remote origin already exists`, run `git remote -v`; if correct, skip `git remote add origin`.

If `Author identity unknown` appears, configure your own name and GitHub commit email:

```powershell
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR_GITHUB_COMMIT_EMAIL"
```

**Verify:** Visit <https://github.com/Nobelesse/Syntax-Sensei> and look for the new commit, source folders and README. Do not upload passwords or `.venv`.

## H. Your acceptance and final approval

Copy the results of **each checklist** (requirements, extraction, install, run, features, GitHub). Paste one or more reports into a single ChatGPT message with screenshots/logs if applicable. After all pass and you explicitly approve the phase, we move to Phase 2.
