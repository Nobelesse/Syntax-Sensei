$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$expectedRoot = 'E:\Projects\Syntax-Sensei'
if ($projectRoot.TrimEnd('\') -ine $expectedRoot) {
    throw "Unexpected project location: $projectRoot. Expected $expectedRoot"
}

Set-Location $projectRoot
if (-not (Test-Path -LiteralPath '.\package.json')) {
    throw 'package.json not found.'
}

$manifest = Get-Content -LiteralPath '.\package.json' -Raw | ConvertFrom-Json
if ($manifest.name -ne 'syntax-sensei' -or $manifest.version -ne '0.1.3') {
    throw 'The Phase 1 Security Fix 03 manifest is not installed.'
}
if ($manifest.devDependencies.vitest -ne '4.1.12') {
    throw 'Incorrect Vitest version. Expected 4.1.12.'
}

$npmText = (& npm --version).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Unable to detect npm version.' }
$npmVersion = [version]$npmText
if ($npmVersion -lt [version]'11.6.0') {
    throw "npm $npmText may trigger the edgesOut bug. Run: npm install -g npm@11.19.1, reopen PowerShell, then retry."
}

$backupRoot = 'E:\Projects\Syntax-Sensei-backups'
$backupPath = Join-Path $backupRoot ('security-fix-03-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
Copy-Item -LiteralPath '.\package.json' -Destination (Join-Path $backupPath 'package.json') -Force
if (Test-Path -LiteralPath '.\package-lock.json') {
    Copy-Item -LiteralPath '.\package-lock.json' -Destination (Join-Path $backupPath 'package-lock.json') -Force
}
Write-Host "Package files backed up to: $backupPath"

if (Test-Path -LiteralPath '.\node_modules') {
    Write-Host 'Removing the old node_modules tree...'
    Remove-Item -LiteralPath '.\node_modules' -Recurse -Force
}
if (Test-Path -LiteralPath '.\node_modules') {
    throw 'node_modules was not completely removed. Close running VS Code extension windows and retry.'
}
if (Test-Path -LiteralPath '.\package-lock.json') {
    Remove-Item -LiteralPath '.\package-lock.json' -Force
}

Write-Host 'Installing dependencies and generating a new package-lock.json...'
& npm install --no-fund
if ($LASTEXITCODE -ne 0) {
    throw 'npm install failed. Do not push yet. Send the terminal output and npm debug log.'
}

Write-Host 'Checking package versions...'
& npm ls vitest vite '@vscode/vsce'
if ($LASTEXITCODE -ne 0) { throw 'npm ls detected invalid or missing dependencies.' }

Write-Host 'Dependency reinstallation complete. Run npm audit and the Phase 1 test script next.'
