# ─────────────────────────────────────────────────────
#  UCoach - Start All Services
#  Run from the project root:  .\start-all.ps1
# ─────────────────────────────────────────────────────

$root = $PSScriptRoot

Write-Host ""
Write-Host "  =====================================" -ForegroundColor Cyan
Write-Host "       UCoach  -  Starting Up...       " -ForegroundColor Cyan
Write-Host "  =====================================" -ForegroundColor Cyan
Write-Host ""

# --- Helper: kill any process using a given port ---
function Free-Port($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        Write-Host "  Killing stale process on port $port (PID $($c.OwningProcess))..." -ForegroundColor Red
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# --- Ensure backend node_modules exist ---
if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Magenta
    Push-Location "$root\backend"
    npm install
    Pop-Location
}

# --- Free ports from previous runs ---
Free-Port 5825
Free-Port 8010

# 1) Node backend  (port 5825)
Write-Host "  [1/3]  Starting Node backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; Write-Host '-- Backend (port 5825) --' -ForegroundColor Green; node server.js"

# 2) ML service  (port 8010)
Write-Host "  [2/3]  Starting ML service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\ml_service'; Write-Host '-- ML Service (port 8010) --' -ForegroundColor Green; python -m uvicorn ptt_service:app --host 0.0.0.0 --port 8010"

# 3) Expo dev server (stays in this terminal)
Write-Host "  [3/3]  Starting Expo dev server..." -ForegroundColor Yellow
Write-Host ""

Set-Location $root
npx expo start
