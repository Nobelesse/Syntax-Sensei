# Syntax-Sensei Phase 1 — Fix 01 (E-drive migration and TypeScript build)

## Problem corrected

Original Phase 1 had `vite@6.1.0` and `vitest@2.1.9`. Vitest 2 has an incompatible Vite peer requirement and caused `TS2769: PluginOption[] is not assignable to PluginOption` at `vite.config.ts`. This update uses `vite@6.4.6`, `vitest@3.2.4`, plus separate build and test config files.

## Step 1 — Close VS Code for this project

Close the current Syntax-Sensei VS Code windows and stop any running backend terminal.

## Step 2 — Copy the project to E drive, retaining the original as backup

Run the following in PowerShell:

```powershell
$source = "C:\Users\adity\Projects\Syntax-Sensei"
$destination = "E:\Projects\Syntax-Sensei"
if (!(Test-Path $source)) { throw "Original project folder not found." }
New-Item -ItemType Directory -Force -Path "E:\Projects" | Out-Null
if (Test-Path $destination) { throw "Destination already exists. Inspect it before copying." }
robocopy $source $destination /E /XD .venv node_modules dist .pytest_cache __pycache__ /R:2 /W:1
if ($LASTEXITCODE -ge 8) { throw "Copy failed; check robocopy output." }
Set-Location $destination
Get-ChildItem
```

The `robocopy` exit code may be 1–7 on success/partial information; 8 or higher indicates a failure. Your source is not removed.

## Step 3 — Apply Fix 01 to the new E-drive folder

Place `Syntax-Sensei-Phase-01-Fix-01.zip` in Downloads. Its archive paths start with `Syntax-Sensei/`, so extract it into the **parent directory** `E:\Projects`, not `E:\Projects\Syntax-Sensei`.

```powershell
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-01-Fix-01.zip" -DestinationPath "E:\Projects" -Force
Set-Location "E:\Projects\Syntax-Sensei"
```

This overwrites only the included files. It leaves your `.git`, any existing `package-lock.json`, other source files, and databases alone.

## Step 4 — Reinstall at E location and regenerate the lockfile

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
npm ls vite vitest
```

The setup script creates a new `.venv` at E and updates `package-lock.json` with the new packages. Confirm you no longer have `vitest@2.1.9` and preferably have one version of Vite 6.

## Step 5 — Test and launch

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
code .
```

Press F5 in VS Code, open the Syntax-Sensei sidebar and Learning Dashboard, verify **Connected**, mark/unmark a Python lesson, close and reopen to check progress.

## Step 6 — Review security audit separately

```powershell
npm audit
```

Some warnings in original logs referred to security advisories in development dependencies. Avoid `npm audit fix --force` without reviewing its changes. Report the package names and advisory details if warnings persist.

## Step 7 — Commit and push ONLY after all acceptance tests pass

For the first Git push:

```powershell
git init
git branch -M main
git status
git add .
git commit -m "Phase 1: Foundation and build compatibility fix"
git remote add origin https://github.com/Nobelesse/Syntax-Sensei.git
git push -u origin main
```

If `.git` already exists, skip `git init`. If `origin` exists, verify `git remote -v` instead of adding it again. Never push `.venv`, `node_modules` or secrets. A regenerated `package-lock.json` should be committed to support reproducible npm installs.

## Error reporting

Copy the acceptance checklist and include the exact failing command, the terminal output, and screenshots in the same ChatGPT message. We will not approve Phase 1 until the tests and push verification pass.
