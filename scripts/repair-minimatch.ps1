$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$expectedRoot = 'E:\Projects\Syntax-Sensei'
if ($projectRoot.TrimEnd('\') -ine $expectedRoot) {
    throw "Unexpected project location: $projectRoot. Expected: $expectedRoot"
}
Set-Location $projectRoot

if (-not (Test-Path -LiteralPath '.\package.json')) { throw 'Missing package.json' }
if (-not (Test-Path -LiteralPath '.\scripts\apply-minimatch-override.cjs')) { throw 'Missing patch script' }

$npmText = (& npm --version).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Could not read npm version' }
if ([version]$npmText -lt [version]'11.6.0') {
    throw "npm $npmText is too old for this repair. Update npm and reopen PowerShell."
}

$backupRoot = 'E:\Projects\Syntax-Sensei-backups'
$backupPath = Join-Path $backupRoot ('security-fix-04-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
Copy-Item -LiteralPath '.\package.json' -Destination (Join-Path $backupPath 'package.json') -Force
if (Test-Path -LiteralPath '.\package-lock.json') {
    Copy-Item -LiteralPath '.\package-lock.json' -Destination (Join-Path $backupPath 'package-lock.json') -Force
}
Write-Host "Dependency files backed up to: $backupPath"

& node '.\scripts\apply-minimatch-override.cjs'
if ($LASTEXITCODE -ne 0) { throw 'Could not apply minimatch override. No dependencies installed.' }

Write-Host 'Installing updated transitive dependency and refreshing package-lock.json...'
& npm install --no-fund
if ($LASTEXITCODE -ne 0) {
    throw 'npm install failed. Keep your backup and share the npm error output.'
}

Write-Host 'Installed dependency versions:'
& npm ls minimatch '@vscode/vsce' vitest vite
if ($LASTEXITCODE -ne 0) { throw 'npm ls found an invalid dependency tree.' }
Write-Host 'Repair script completed. Next run npm audit, automated tests, build, and VSCE package-list check.'
