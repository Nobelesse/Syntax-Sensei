$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $projectRoot
Write-Host 'Phase 2: Python API and mocked Ollama tests, React tests, and extension build' -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1
if ($LASTEXITCODE -ne 0) { throw 'Automated tests failed.' }
Write-Host 'Checking npm dependency audit...' -ForegroundColor Cyan
npm audit
if ($LASTEXITCODE -ne 0) { throw 'npm audit reported unresolved vulnerabilities. See the report.' }
Write-Host 'Checking VS Code extension packaging inputs...' -ForegroundColor Cyan
npx --no-install vsce ls
if ($LASTEXITCODE -ne 0) { throw 'VSCE packaging check failed.' }
Write-Host 'Phase 2 automated checks passed. Manual Ollama and extension tests are still required.' -ForegroundColor Green
