# PowerShell script to fix Windows Firewall for Eventopia
# Run this as Administrator

Write-Host "🔥 Fixing Windows Firewall for Eventopia..." -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click on this file and select 'Run with PowerShell as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Remove old rules if they exist
Write-Host "🧹 Cleaning up old firewall rules..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Eventopia Backend" 2>$null
netsh advfirewall firewall delete rule name="Expo Metro" 2>$null
netsh advfirewall firewall delete rule name="Expo Dev" 2>$null
netsh advfirewall firewall delete rule name="Node.js" 2>$null

Write-Host ""
Write-Host "➕ Adding new firewall rules..." -ForegroundColor Yellow

# Add rule for backend (port 3000)
Write-Host "   Adding rule for Backend (port 3000)..." -ForegroundColor Gray
netsh advfirewall firewall add rule name="Eventopia Backend" dir=in action=allow protocol=TCP localport=3000 profile=any

# Add rule for Metro bundler (port 8081)
Write-Host "   Adding rule for Metro Bundler (port 8081)..." -ForegroundColor Gray
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081 profile=any

# Add rule for Expo (port 19000)
Write-Host "   Adding rule for Expo Dev (port 19000)..." -ForegroundColor Gray
netsh advfirewall firewall add rule name="Expo Dev" dir=in action=allow protocol=TCP localport=19000 profile=any

# Add rule for Expo web (port 19006)
Write-Host "   Adding rule for Expo Web (port 19006)..." -ForegroundColor Gray
netsh advfirewall firewall add rule name="Expo Web" dir=in action=allow protocol=TCP localport=19006 profile=any

Write-Host ""
Write-Host "✅ Firewall rules added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   ✓ Port 3000 - Backend API" -ForegroundColor Green
Write-Host "   ✓ Port 8081 - Metro Bundler" -ForegroundColor Green
Write-Host "   ✓ Port 19000 - Expo Dev Server" -ForegroundColor Green
Write-Host "   ✓ Port 19006 - Expo Web" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your phone should now be able to connect to your backend!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your backend server (Ctrl+C then npm run dev)" -ForegroundColor White
Write-Host "2. Restart your Expo app (press 'r' in Expo CLI)" -ForegroundColor White
Write-Host "3. Test the connection again" -ForegroundColor White
Write-Host ""
pause
