# ============================================
# SMART STARTUP SCRIPT
# Intelligently starts full-stack app with health checks
# ============================================

$ErrorActionPreference = "Continue"
$ProgressPreference = 'SilentlyContinue'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "     SMART FULL-STACK STARTUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# STEP 1: Detect Network Configuration
# ============================================
Write-Host "[1/6] Detecting network configuration..." -ForegroundColor Yellow

# Get active network adapter IP (prefer hotspot/WiFi)
$networkIPs = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notmatch '^127\.' -and 
        $_.IPAddress -notmatch '^169\.254\.' -and
        $_.PrefixOrigin -eq 'Dhcp'
    } | 
    Select-Object -ExpandProperty IPAddress

if ($networkIPs.Count -eq 0) {
    Write-Host "   WARNING: No DHCP IP found, using localhost only" -ForegroundColor Yellow
    $hostIP = "localhost"
} elseif ($networkIPs.Count -eq 1) {
    $hostIP = $networkIPs[0]
    Write-Host "   Detected IP: $hostIP" -ForegroundColor Green
} else {
    Write-Host "   Multiple IPs detected:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $networkIPs.Count; $i++) {
        Write-Host "      [$i] $($networkIPs[$i])"
    }
    $choice = Read-Host "   Select IP index (default 0)"
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = 0 }
    $hostIP = $networkIPs[[int]$choice]
    Write-Host "   Selected: $hostIP" -ForegroundColor Green
}

$apiBase = "http://${hostIP}:9090/api"

# ============================================
# STEP 2: Clean Previous Processes
# ============================================
Write-Host "`n[2/6] Cleaning previous processes..." -ForegroundColor Yellow

$javaProcesses = Get-Process -Name java -ErrorAction SilentlyContinue
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($javaProcesses) {
    Write-Host "   Stopping $($javaProcesses.Count) Java process(es)..." -ForegroundColor Gray
    $javaProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if ($nodeProcesses) {
    Write-Host "   Stopping $($nodeProcesses.Count) Node process(es)..." -ForegroundColor Gray
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "   Cleanup complete" -ForegroundColor Green

# ============================================
# STEP 3: Start Backend with Health Check
# ============================================
Write-Host "`n[3/6] Starting backend server..." -ForegroundColor Yellow

$backendPath = "c:\Users\mns\my-fullstack-app\backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "   ERROR: Backend path not found: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host "   Launching Spring Boot..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$backendPath'; Write-Host 'Backend Server Starting...' -ForegroundColor Cyan; .\mvnw.cmd spring-boot:run"

Write-Host "   Waiting for backend to be ready..." -ForegroundColor Gray

$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -NoNewline
    
    try {
        $response = Invoke-RestMethod -Uri "http://${hostIP}:9090/api/products" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response) {
            $productCount = $response.Count
            Write-Host " SUCCESS" -ForegroundColor Green
            Write-Host "   Backend ready with $productCount products" -ForegroundColor Green
            $backendReady = $true
        }
    } catch {
        Write-Host " ..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "   ERROR: Backend failed to start within $($maxAttempts * 2) seconds" -ForegroundColor Red
    Write-Host "   Check backend terminal for errors" -ForegroundColor Yellow
    exit 1
}

# ============================================
# STEP 4: Start Client Frontend
# ============================================
Write-Host "`n[4/6] Starting client frontend (web + mobile)..." -ForegroundColor Yellow

$clientPath = "c:\Users\mns\my-fullstack-app\frontend"
if (-not (Test-Path $clientPath)) {
    Write-Host "   ERROR: Client path not found: $clientPath" -ForegroundColor Red
    exit 1
}

Write-Host "   Launching Expo Metro (port 19006)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$clientPath'; `$env:EXPO_PUBLIC_API_BASE='$apiBase'; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host 'CLIENT METRO BUNDLER' -ForegroundColor Cyan; " +
    "Write-Host '========================================' -ForegroundColor Cyan; " +
    "Write-Host 'API Base: $apiBase' -ForegroundColor Green; " +
    "Write-Host ''; " +
    "Write-Host 'Press W for web browser' -ForegroundColor Yellow; " +
    "Write-Host 'Scan QR with Expo Go for mobile' -ForegroundColor Yellow; " +
    "Write-Host ''; " +
    "npx expo start --port 19006"

Write-Host "   Client Metro launching..." -ForegroundColor Green

# ============================================
# STEP 5: Start Admin Frontend
# ============================================
Write-Host "`n[5/6] Starting admin frontend (web only)..." -ForegroundColor Yellow

$adminPath = "c:\Users\mns\my-fullstack-app\frontend-admin"
if (-not (Test-Path $adminPath)) {
    Write-Host "   ERROR: Admin path not found: $adminPath" -ForegroundColor Red
    exit 1
}

Write-Host "   Launching Expo Metro (port 19007)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$adminPath'; `$env:EXPO_PUBLIC_API_BASE='$apiBase'; " +
    "Write-Host '========================================' -ForegroundColor Magenta; " +
    "Write-Host 'ADMIN METRO BUNDLER' -ForegroundColor Magenta; " +
    "Write-Host '========================================' -ForegroundColor Magenta; " +
    "Write-Host 'API Base: $apiBase' -ForegroundColor Green; " +
    "Write-Host ''; " +
    "Write-Host 'Press W for web browser' -ForegroundColor Yellow; " +
    "Write-Host 'Login: admin / admin123' -ForegroundColor Cyan; " +
    "Write-Host ''; " +
    "npx expo start --port 19007 --web"

Write-Host "   Admin Metro launching..." -ForegroundColor Green

# ============================================
# STEP 6: Summary
# ============================================
Write-Host "`n[6/6] Startup complete!" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         STARTUP SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nNetwork Configuration:" -ForegroundColor Yellow
Write-Host "  API Base URL: $apiBase" -ForegroundColor White

Write-Host "`nBackend:" -ForegroundColor Yellow
Write-Host "  Status: Running" -ForegroundColor Green
Write-Host "  URL: http://${hostIP}:9090" -ForegroundColor White
Write-Host "  Products: Check terminal for count" -ForegroundColor White

Write-Host "`nClient Frontend:" -ForegroundColor Yellow
Write-Host "  Metro Port: 19006" -ForegroundColor White
Write-Host "  Web: Press 'w' in client terminal" -ForegroundColor White
Write-Host "  Mobile: Scan QR code with Expo Go" -ForegroundColor White
Write-Host "  Test Login: testuser / password123" -ForegroundColor Cyan

Write-Host "`nAdmin Frontend:" -ForegroundColor Yellow
Write-Host "  Metro Port: 19007" -ForegroundColor White
Write-Host "  Web: Press 'w' in admin terminal" -ForegroundColor White
Write-Host "  Login: admin / admin123" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Wait for Metro bundlers to be ready (QR codes visible)" -ForegroundColor White
Write-Host "  2. Press 'w' in each Metro terminal to open web browsers" -ForegroundColor White
Write-Host "  3. For mobile: Scan client QR code with Expo Go app" -ForegroundColor White
Write-Host "  4. Login to test functionality" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan

Write-Host "All services started. Check individual terminals for status." -ForegroundColor Green
Write-Host "Press any key to exit this script (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
