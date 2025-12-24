# PowerShell helper to start backend + frontends with automatic IP export for Expo
# Usage: Run in an elevated or normal PowerShell window:  .\scripts\start-all-expo.ps1

# Detect IPv4 likely used by hotspot / Wi-Fi (filters private ranges)
$ipv4 = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -match '^(192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|10\.)' -and ($_.InterfaceAlias -match 'Wi-Fi|Wireless|Hotspot|Mobile')
} | Select-Object -First 1 -ExpandProperty IPAddress)

if ($ipv4) { $ipv4 = $ipv4.Trim() }

if (-not $ipv4) {
    Write-Host 'Could not auto-detect Wi-Fi IPv4. Falling back to localhost.' -ForegroundColor Yellow
    $ipv4 = 'localhost'
} else {
    Write-Host "Detected Wi-Fi IP: $ipv4" -ForegroundColor Green
}

$apiBase = 'http://' + $ipv4 + ':9090/api'
Write-Host "Debug: ipv4='$ipv4' length=$($ipv4.Length)" -ForegroundColor Magenta
if ($apiBase -eq 'http:///api') {
    Write-Host 'IP detection anomaly: empty host. Falling back to localhost.' -ForegroundColor Yellow
    $apiBase = 'http://localhost:9090/api'
}
Write-Host "API Base: $apiBase" -ForegroundColor Cyan

# Start backend in separate window
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\backend; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized

# Start client frontend
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\frontend; $env:EXPO_PUBLIC_API_BASE='$apiBase'; npm start" -WindowStyle Normal

# Start admin frontend
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\frontend-admin; $env:EXPO_PUBLIC_API_BASE='$apiBase'; npm start" -WindowStyle Normal

Write-Host "Launched backend + client + admin with EXPO_PUBLIC_API_BASE=$apiBase" -ForegroundColor Green
