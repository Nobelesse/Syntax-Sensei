# Syntax-Sensei Phase 1 — Security Fix 04

## Scope

This repair is **only** for the working Phase 1 project at `E:\Projects\Syntax-Sensei` after Security Fix 03.

The November 2026 audit identifies the VS Code packaging tool `@vscode/vsce@4.1.1` pulling a vulnerable `minimatch@10.x`. Security advisory GHSA-g3hv-75wg-m249 is fixed in minimatch 11.0.1+. The npm override in this repair **scopes the change to VSCE** and requests minimatch 11.0.8. It does not change Python, React, Ollama, SQLite or lesson data.

Because this forces a major transitive dependency upgrade, the extension packaging tool also needs smoke testing. A zero-vulnerability audit by itself does not guarantee compatibility.

## Apply

1. Close the Extension Development Host. Leave your existing GitHub repository and backup folders intact.
2. Download `Syntax-Sensei-Phase-01-Security-Fix-04.zip` to Downloads.
3. From PowerShell:

```powershell
Expand-Archive -LiteralPath "$HOME\Downloads\Syntax-Sensei-Phase-01-Security-Fix-04.zip" -DestinationPath 'E:\Projects' -Force
Set-Location 'E:\Projects\Syntax-Sensei'
powershell -ExecutionPolicy Bypass -File .\scripts\repair-minimatch.ps1
```

## Verify

```powershell
npm ls minimatch @vscode/vsce vitest vite
npm audit
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
npm run build
npx --no-install vsce ls
```

The desired `npm audit` result is `found 0 vulnerabilities`. `npx --no-install vsce ls` checks that VSCE can enumerate the extension's packaging files. We also recommend testing `npm run package:vsix` before publishing any extension, because minimatch 11 has a major-version API/behavior change. If the packaging test fails, share the error output and do **not** push this repair yet.

Run `code .`, press F5, open the dashboard, check backend connection and persisted lesson completion.

## Rollback

The repair script prints a backup directory under `E:\Projects\Syntax-Sensei-backups\security-fix-04-*`. If you need to revert, restore its `package.json` and `package-lock.json` to the project root and run `npm ci`; this restores the previous working dependencies. The script never removes project data, Git history or the Python venv.

## Git

After `npm audit`, the automated tests, the build and VSCE packaging-list check pass, commit only the changed dependency files and the repair documentation/scripts:

```powershell
Set-Location 'E:\Projects\Syntax-Sensei'
git status
git add package.json package-lock.json scripts/apply-minimatch-override.cjs scripts/repair-minimatch.ps1 docs/SECURITY_FIX_04.md
git diff --cached --stat
git commit -m 'Resolve Phase 1 VSCE minimatch security advisory'
git push origin main
```

Do not use `npm audit fix --force`; it attempts a VSCE downgrade and may introduce new problems. Do not push private progress databases or `.venv` / `node_modules`.
