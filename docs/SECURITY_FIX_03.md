# Syntax-Sensei Phase 1 - Security Fix 03

This patch repairs the incomplete Security Fix 02 npm installation for the project at `E:\Projects\Syntax-Sensei`.

## Findings

- The existing Python and React tests and the VS Code UI worked.
- npm 10.9.8 hit the known Arborist `edgesOut` dependency-resolution bug during the upgrade.
- Since `npm install` failed, the installed packages stayed at their previous versions and `npm ls` reported invalid dependencies.
- Vitest 4.1.11 was subject to an additional Windows path traversal issue fixed in **4.1.12**. This patch pins **4.1.12**.
- `@vscode/vsce` remains pinned to **4.1.1**, published November 12, 2026.

## Apply

1. Close the Extension Development Host and VS Code windows for this project.
2. Run `npm install -g npm@11.19.1` in a normal PowerShell terminal, then verify using `npm --version`.
3. Extract the ZIP into `E:\Projects` (the archive already includes the `Syntax-Sensei` folder).
4. Open PowerShell at `E:\Projects\Syntax-Sensei`.
5. Run `powershell -ExecutionPolicy Bypass -File .\scripts\repair-npm-deps.ps1`.
6. Run `npm audit` and `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`.
7. Run `npm run build`, then reopen VS Code and use F5 to check the dashboard, backend and saved lesson progress.

## Backup and safety

The repair script copies `package.json` and `package-lock.json` into a timestamped folder under `E:\Projects\Syntax-Sensei-backups` before removing only the old `node_modules` directory and the stale lockfile. The script then regenerates the lockfile with npm 11. It does not modify `.venv`, SQLite data, application source, Git configuration, or your local progress.

If any command fails, do **not** commit the updated lockfile or push the fix. Send the error output or a screenshot for diagnosis.

## GitHub (after checks pass)

Run `git status`, then stage only `package.json`, `package-lock.json`, `scripts/repair-npm-deps.ps1`, and `docs/SECURITY_FIX_03.md` for a corrective commit. The repository already exists; do not run `git init` again.
