$ErrorActionPreference = 'Stop'
Write-Host 'Checking installed models (no downloads):' -ForegroundColor Cyan
ollama list
if ($LASTEXITCODE -ne 0) { throw 'Ollama CLI failed; check your installation.' }
Write-Host 'Checking the local API on 127.0.0.1:11434:' -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -Method Get -TimeoutSec 5
    $result.models | Select-Object name, size | Format-Table
    Write-Host 'Ollama local API reachable.' -ForegroundColor Green
} catch {
    Write-Host 'Ollama is not listening. Start the Ollama desktop app (or ollama serve), then retry.' -ForegroundColor Yellow
    throw
}
