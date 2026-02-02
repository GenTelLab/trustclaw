# OpenClaw SecurityAudit-CN Windows Installer Build Script
# Usage: powershell -ExecutionPolicy Bypass -File build-installer.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  OpenClaw SecurityAudit-CN Installer Build " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..").FullName
$appDir = $scriptDir

Write-Host "[Info] Script dir: $scriptDir" -ForegroundColor Gray
Write-Host "[Info] Root dir: $rootDir" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Node.js
Write-Host "[1/8] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "       Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "       Error: Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Check pnpm
Write-Host "[2/8] Checking pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "       pnpm: $pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Host "       Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       Error: pnpm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Step 3: Install dependencies
Write-Host "[3/8] Installing dependencies..." -ForegroundColor Yellow
Set-Location $rootDir
pnpm install 2>&1 | Out-Null
Write-Host "       Done" -ForegroundColor Green

# Step 4: Build main project
Write-Host "[4/8] Building main project..." -ForegroundColor Yellow
pnpm build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       Warning: build may have issues" -ForegroundColor Yellow
}
Write-Host "       Done" -ForegroundColor Green

# Step 5: Build Control UI
Write-Host "[5/8] Building Control UI..." -ForegroundColor Yellow
Set-Location "$rootDir\ui"
pnpm build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       Error: UI build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "       Done" -ForegroundColor Green

# Step 6: Install app dependencies
Write-Host "[6/8] Installing app dependencies..." -ForegroundColor Yellow
Set-Location $appDir
npm install 2>&1 | Out-Null
Write-Host "       Done" -ForegroundColor Green

# Step 7: Prepare icons
Write-Host "[7/8] Preparing icons..." -ForegroundColor Yellow

$buildDir = "$appDir\build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}

$pngSource = "$appDir\renderer\logo.png"
$pngDest = "$buildDir\icon.png"
$icoDest = "$buildDir\icon.ico"

if (Test-Path $pngSource) {
    Copy-Item $pngSource $pngDest -Force
    Write-Host "       Copied icon.png" -ForegroundColor Green
    
    if (-not (Test-Path $icoDest)) {
        Copy-Item $pngSource $icoDest -Force
        Write-Host "       Created icon.ico" -ForegroundColor Green
    }
}
else {
    Write-Host "       Warning: icon not found" -ForegroundColor Yellow
}

# Step 8: Build installer
Write-Host "[8/8] Building Windows installer..." -ForegroundColor Yellow
Write-Host ""

npx electron-builder --win nsis --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "           BUILD SUCCESS!                   " -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    
    $distDir = "$appDir\dist"
    if (Test-Path $distDir) {
        Write-Host "Generated installer:" -ForegroundColor Cyan
        Get-ChildItem $distDir -Filter "*.exe" | ForEach-Object {
            $sizeMB = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  -> $($_.Name) ($sizeMB MB)" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Location: $distDir" -ForegroundColor Cyan
        Start-Process explorer.exe $distDir
    }
}
else {
    Write-Host ""
    Write-Host "BUILD FAILED! Check errors above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
