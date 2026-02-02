# Fix Electron installation script

Write-Host "Fixing Electron installation..." -ForegroundColor Cyan

# Set Electron mirror for faster download
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

# Clean old Electron
Write-Host "Cleaning old Electron installation..." -ForegroundColor Yellow
$electronPaths = @(
    "node_modules\electron",
    "..\..\node_modules\.pnpm\electron@32.3.3"
)

foreach ($path in $electronPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "Deleted: $path" -ForegroundColor Gray
    }
}

# Reinstall
Write-Host "Reinstalling Electron..." -ForegroundColor Yellow
pnpm install electron@32.3.3 --save-dev --force

# Check installation
$electronExe = "..\..\node_modules\.pnpm\electron@32.3.3\node_modules\electron\dist\electron.exe"
if (Test-Path $electronExe) {
    Write-Host "Electron installed successfully!" -ForegroundColor Green
    Write-Host "You can now run: pnpm start" -ForegroundColor Green
} else {
    Write-Host "Electron installation failed" -ForegroundColor Red
    Write-Host "Please check your network connection" -ForegroundColor Yellow
}
