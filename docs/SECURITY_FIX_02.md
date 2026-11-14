# Phase 1 — Security Update 02 (existing E: installation)

Only two files are packaged: `package.json` and this guide. Everything else must remain unchanged.
This patch targets the 2026-11-14 npm audit findings caused by the older Vitest and `@vscode/vsce` dev dependencies. It updates Vitest 3.2.4 -> 4.1.11, and `@vscode/vsce` 3.3.2 -> 4.1.1, which may regenerate the local `package-lock.json` when dependencies are installed. It also updates project package version to 0.1.2.

The previously working React/Vite/Python code is **not modified**. The new tool versions have not yet been built and tested on the user's machine; their build and audit results need confirmation.

## Backup and extract

1. Close Extension Development Host and VS Code running this project. Leave the original C: backup in place.
2. Save `Syntax-Sensei-Phase-01-Security-Fix-02.zip` to Downloads.
3. In PowerShell:

```powershell
Set-Location 'E:\Projects\Syntax-Sensei'
New-Item -ItemType Directory -Force -Path 'E:\Projects\Syntax-Sensei-backups' | Out-Null
Copy-Item .\package.json 'E:\Projects\Syntax-Sensei-backups\package.before-security-fix.json' -Force
if (Test-Path .\package-lock.json) { Copy-Item .\package-lock.json 'E:\Projects\Syntax-Sensei-backups\package-lock.before-security-fix.json' -Force }
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-01-Security-Fix-02.zip" -DestinationPath 'E:\Projects' -Force
Set-Location 'E:\Projects\Syntax-Sensei'
npm install
```

## Verification

```powershell
npm ls vitest vite @vscode/vsce
npm audit
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
npm run build
code .
```

Press F5 in the original VS Code window, open the dashboard in the Extension Development Host, and confirm backend `Connected` and saved lesson progress.

**Do not use `npm audit fix --force` or push to GitHub if test/build/audit checks have not been reviewed.** Send the error output and screenshots together with the phase acceptance checklist. If necessary, the original package files can be restored from the two backups in `E:\Projects\Syntax-Sensei-backups`, outside the Git project.

Once accepted, include `package.json` and the generated `package-lock.json` in the initial Git commit. Ensure no `.venv`, `node_modules`, sensitive files, or Python DB are committed.
