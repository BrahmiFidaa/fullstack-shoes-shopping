# Full Stack App Startup Script
# Starts backend + both frontends (client + admin) for web and Expo Go mobile testing
# Phone must be hotspot for PC

Write-Host "=== Full Stack App Startup ===" -ForegroundColor Cyan

# Step 1: Clean stale processes
Write-Host "[1/6] Cleaning old processes..." -ForegroundColor Yellow
Get-Process -Name java,node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Detect hotspot IP
Write-Host "[2/6] Detecting hotspot IP..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -match '^(192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|10\.)' -and 
    $_.InterfaceAlias -match 'Wi-Fi|Wireless|Hotspot' 
} | Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) {
    Write-Host "ERROR: Could not detect hotspot/Wi-Fi IP. Using fallback 10.163.195.63" -ForegroundColor Red
    $ip = "10.163.195.63"
} else {
    Write-Host "Detected IP: $ip" -ForegroundColor Green
}

$apiBase = "http://${ip}:9090/api"
Write-Host "API Base URL: $apiBase" -ForegroundColor Cyan

# Step 3: Start backend
Write-Host "[3/6] Starting backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location c:\Users\mns\my-fullstack-app\backend; Write-Host 'Backend starting...' -ForegroundColor Green; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

# Step 4: Wait for backend to be ready
Write-Host "[4/6] Waiting for backend on port 9090..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9090/api/products" -UseBasicParsing -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend ready!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $waited++
    }
}

if ($waited -ge $maxWait) {
    Write-Host "`nWARNING: Backend may not be ready. Continuing anyway..." -ForegroundColor Yellow
}

# Step 5: Verify products from hotspot IP
Write-Host "[5/6] Testing products from $ip..." -ForegroundColor Yellow
try {
    $products = Invoke-RestMethod -Uri "${apiBase}/products" -ErrorAction Stop
    Write-Host "Products accessible: $($products.Count) items" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not fetch products from hotspot IP: $_" -ForegroundColor Yellow
}

# Step 6: Start frontends
Write-Host "[6/6] Starting frontends..." -ForegroundColor Yellow

# Client frontend (Web + Expo Go for phone)
Write-Host "  - Client: Web + Mobile (Expo Go)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location c:\Users\mns\my-fullstack-app\frontend; `$env:EXPO_PUBLIC_API_BASE='$apiBase'; Write-Host 'CLIENT FRONTEND' -ForegroundColor Cyan; Write-Host 'API Base: $apiBase' -ForegroundColor White; Write-Host 'Supports: Web + Expo Go (scan QR)' -ForegroundColor Green; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Admin frontend (Web only - no mobile)
Write-Host "  - Admin: Web only" -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location c:\Users\mns\my-fullstack-app\frontend-admin; `$env:EXPO_PUBLIC_API_BASE='$apiBase'; Write-Host 'ADMIN FRONTEND (WEB ONLY)' -ForegroundColor Magenta; Write-Host 'API Base: $apiBase' -ForegroundColor White; Write-Host 'Press W for web (do not scan QR)' -ForegroundColor Yellow; npm start" -WindowStyle Normal

Write-Host "`n=== Startup Complete ===" -ForegroundColor Green
Write-Host "Backend: http://localhost:9090" -ForegroundColor White
Write-Host "Backend (hotspot): http://${ip}:9090" -ForegroundColor White
Write-Host "API Base for frontends: $apiBase" -ForegroundColor White
Write-Host "`nCLIENT Frontend (Metro Terminal):" -ForegroundColor Cyan
Write-Host "  - Press 'w' for web version" -ForegroundColor White
Write-Host "  - Scan QR with Expo Go on phone for mobile" -ForegroundColor White
Write-Host "  - Test login available after auth" -ForegroundColor Gray
Write-Host "`nADMIN Frontend (Metro Terminal):" -ForegroundColor Magenta
Write-Host "  - Press 'w' for web version ONLY" -ForegroundColor White
Write-Host "  - Do NOT scan QR (admin is web-only)" -ForegroundColor Yellow
Write-Host "  - Test login available after auth" -ForegroundColor Gray
Write-Host "`nIf Expo Go shows blank/error on phone:" -ForegroundColor Yellow
Write-Host "  1. Shake device → Reload" -ForegroundColor White
Write-Host "  2. Check Metro log shows: [API] Base URL: http://${ip}:9090/api" -ForegroundColor White
Write-Host "  3. Ensure phone and PC on same hotspot" -ForegroundColor White
Write-Host "`nTo stop all: Get-Process -Name java,node | Stop-Process -Force" -ForegroundColor Red
