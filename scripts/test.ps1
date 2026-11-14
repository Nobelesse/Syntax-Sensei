$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $projectRoot
Write-Host 'Running Python API tests...' -ForegroundColor Cyan
& .\.venv\Scripts\python.exe -m pytest backend\tests -q
if ($LASTEXITCODE -ne 0) { throw 'Python tests failed' }
Write-Host 'Running React/TypeScript checks...' -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { throw 'Webview tests failed' }
Write-Host 'Rebuilding extension...' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Extension build failed' }
Write-Host 'All automated checks passed.' -ForegroundColor Green
