$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $projectRoot
Write-Host 'Syntax-Sensei Phase 1 - Windows setup' -ForegroundColor Cyan
python -m venv .venv
if ($LASTEXITCODE -ne 0) { throw 'Could not create Python virtual environment' }
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw 'pip upgrade failed' }
& .\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed' }
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm dependency installation failed' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
Write-Host 'Setup complete. Open this folder in VS Code and press F5.' -ForegroundColor Green
