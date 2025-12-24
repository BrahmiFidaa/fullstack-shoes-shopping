# Manual Restart Commands
# Run these one by one in PowerShell

# 1. Stop everything
Get-Process -Name java,node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Start backend
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\backend; .\mvnw.cmd spring-boot:run"

# 3. Wait 15 seconds for backend
Start-Sleep -Seconds 15

# 4. Test backend from hotspot IP (replace if different)
$ip = '10.163.195.63'
Invoke-RestMethod -Uri "http://${ip}:9090/api/products" | Select-Object -First 3 | Format-Table id,name,price

# 5. Start CLIENT (web + Expo Go mobile)
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\frontend; `$env:EXPO_PUBLIC_API_BASE='http://10.163.195.63:9090/api'; npm start"

# 6. Start ADMIN (web only)
Start-Process powershell -ArgumentList "-NoExit","Set-Location c:\Users\mns\my-fullstack-app\frontend-admin; `$env:EXPO_PUBLIC_API_BASE='http://10.163.195.63:9090/api'; npm start"

# After Metro starts (look for QR code):
# - CLIENT terminal: Press 'w' for web OR scan QR with Expo Go on phone
# - ADMIN terminal: Press 'w' for web only (do NOT scan QR)

# ============================================
# LOGIN CREDENTIALS
# ============================================
# CLIENT (Regular User):
#   Username: testuser
#   Password: password123
#
# ADMIN (Admin Panel):
#   Username: admin
#   Password: admin123
#   NOTE: You MUST login to admin panel to see products!
#
# ARCHITECTURE:
# - Public endpoints: /api/products, /api/auth/**
# - Protected endpoints: /api/cart, /api/orders (JWT required)
# - Admin endpoints: /api/admin/** (JWT + admin role required)
