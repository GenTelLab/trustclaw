# OpenClaw SecurityAudit-CN Full Build Script
# One-click build for Windows installer with full CLI + Gateway
# Usage: powershell -ExecutionPolicy Bypass -File build-full.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  OpenClaw SecurityAudit-CN Full Build      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..").FullName
$appDir = $scriptDir
$openclawDir = "$appDir\packaged-openclaw"

Write-Host "[Info] Script dir: $scriptDir" -ForegroundColor Gray
Write-Host "[Info] Root dir: $rootDir" -ForegroundColor Gray
Write-Host ""

$totalSteps = 8
$currentStep = 0

function Show-Step($message) {
    $script:currentStep++
    Write-Host "[$script:currentStep/$totalSteps] $message" -ForegroundColor Yellow
}

# Step 1: Check environment
Show-Step "Checking environment..."

try {
    $nodeVersion = node --version
    Write-Host "       Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "       Error: Node.js not found. Please install Node.js 22+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $pnpmVersion = pnpm --version
    Write-Host "       pnpm: $pnpmVersion" -ForegroundColor Green
}
catch {
    Write-Host "       pnpm not found, installing..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       Error: pnpm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Step 2: Install dependencies
Show-Step "Installing dependencies..."
Set-Location $rootDir
cmd /c "pnpm install 2>&1" | Out-Null
Write-Host "       Done" -ForegroundColor Green

# Step 3: Build main project
Show-Step "Building main project (TypeScript)..."
# Skip bash scripts on Windows, run tsc directly
$env:npm_config_loglevel = "error"
cmd /c "npx tsc -p tsconfig.json 2>&1" | Out-Null
# Run post-build scripts
if (Test-Path "scripts/copy-hook-metadata.ts") {
    cmd /c "node --import tsx scripts/copy-hook-metadata.ts 2>&1" | Out-Null
}
if (Test-Path "scripts/write-build-info.ts") {
    cmd /c "node --import tsx scripts/write-build-info.ts 2>&1" | Out-Null
}
Write-Host "       Done" -ForegroundColor Green

# Step 4: Build Control UI
Show-Step "Building Control UI..."
Set-Location "$rootDir\ui"
cmd /c "pnpm build 2>&1" | Out-Null
Write-Host "       Done" -ForegroundColor Green

# Step 5: Prepare OpenClaw directory
Show-Step "Preparing OpenClaw directory (dist + node_modules)..."

if (Test-Path $openclawDir) {
    Remove-Item -Recurse -Force $openclawDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $openclawDir -Force | Out-Null

Write-Host "       Copying dist..." -ForegroundColor Gray
$distSrc = "$rootDir\dist"
$distDest = "$openclawDir\dist"
if (Test-Path $distSrc) {
    Copy-Item -Path $distSrc -Destination $distDest -Recurse -Force
}
else {
    Write-Host "       Error: dist not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "       Creating package.json..." -ForegroundColor Gray
$pkgSrc = Get-Content "$rootDir\package.json" -Raw | ConvertFrom-Json
$prodDeps = [ordered]@{
    name         = "openclaw-runtime"
    version      = $pkgSrc.version
    type         = "module"
    dependencies = [ordered]@{}
}
if ($pkgSrc.dependencies) {
    foreach ($dep in $pkgSrc.dependencies.PSObject.Properties) {
        $prodDeps.dependencies[$dep.Name] = $dep.Value
    }
}
$prodDeps | ConvertTo-Json -Depth 10 | Set-Content "$openclawDir\package.json" -Encoding UTF8

Write-Host "       Installing production dependencies..." -ForegroundColor Gray
Push-Location $openclawDir
cmd /c "npm install --omit=dev --legacy-peer-deps 2>&1" | Out-Null
Pop-Location

Write-Host "       Copying native modules..." -ForegroundColor Gray
$nodeModulesDir = "$openclawDir\node_modules"

$nativeModules = @(
    @{ pnpm = "sharp@0.34.5/node_modules/sharp"; name = "sharp" }
    @{ pnpm = "@img+sharp-win32-x64@0.34.5/node_modules/@img/sharp-win32-x64"; name = "@img/sharp-win32-x64" }
    @{ pnpm = "sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec"; name = "sqlite-vec" }
    @{ pnpm = "sqlite-vec-windows-x64@0.1.7-alpha.2/node_modules/sqlite-vec-windows-x64"; name = "sqlite-vec-windows-x64" }
    @{ pnpm = "@mariozechner+clipboard@0.3.0/node_modules/@mariozechner/clipboard"; name = "@mariozechner/clipboard" }
    @{ pnpm = "@mariozechner+clipboard-win32-x64-msvc@0.3.0/node_modules/@mariozechner/clipboard-win32-x64-msvc"; name = "@mariozechner/clipboard-win32-x64-msvc" }
    @{ pnpm = "@lydell+node-pty@1.2.0-beta.3/node_modules/@lydell/node-pty"; name = "@lydell/node-pty" }
    @{ pnpm = "@lydell+node-pty-win32-x64@1.2.0-beta.3/node_modules/@lydell/node-pty-win32-x64"; name = "@lydell/node-pty-win32-x64" }
)

foreach ($mod in $nativeModules) {
    $srcPath = "$rootDir\node_modules\.pnpm\$($mod.pnpm)"
    $destPath = "$nodeModulesDir\$($mod.name)"
    
    if (Test-Path $srcPath) {
        $parentDir = Split-Path -Parent $destPath
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        if (Test-Path $destPath) {
            Remove-Item -Recurse -Force $destPath
        }
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
    }
}

$openclawSize = [math]::Round((Get-ChildItem -Path $openclawDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Host "       Done ($openclawSize MB)" -ForegroundColor Green

# Step 6: Install Electron dependencies
Show-Step "Installing Electron dependencies..."
Set-Location $appDir

if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
cmd /c "npm install 2>&1" | Out-Null
Write-Host "       Done" -ForegroundColor Green

# Step 7: Prepare icons
Show-Step "Preparing icons..."
$buildDir = "$appDir\build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}
$pngSource = "$appDir\renderer\logo.png"
if (Test-Path $pngSource) {
    Copy-Item $pngSource "$buildDir\icon.png" -Force
    Write-Host "       Done" -ForegroundColor Green
}
else {
    Write-Host "       Warning: icon not found" -ForegroundColor Yellow
}

# Step 8: Build installer
Show-Step "Building Windows installer..."
Write-Host ""

if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
}

$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

npx electron-builder --win nsis --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "           BUILD SUCCESS!                   " -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    
    $distDir = "$appDir\dist"
    $installerFile = Get-ChildItem $distDir -Filter "*.exe" | Where-Object { $_.Name -notmatch "uninstaller" } | Select-Object -First 1
    
    if ($installerFile) {
        $sizeMB = [math]::Round($installerFile.Length / 1MB, 2)
        Write-Host "Installer:" -ForegroundColor Cyan
        Write-Host "  File: $($installerFile.Name)" -ForegroundColor White
        Write-Host "  Size: $sizeMB MB" -ForegroundColor White
        Write-Host "  Path: $($installerFile.FullName)" -ForegroundColor White
        
        $targetPath = "$rootDir\$($installerFile.Name)"
        Copy-Item $installerFile.FullName $targetPath -Force
        Write-Host ""
        Write-Host "Copied to:" -ForegroundColor Cyan
        Write-Host "  $targetPath" -ForegroundColor White
        
        Write-Host ""
        Start-Process explorer.exe $rootDir
    }
    
    Write-Host ""
    Write-Host "Features:" -ForegroundColor Cyan
    Write-Host "  [OK] Full OpenClaw CLI (no Node.js needed)" -ForegroundColor Green
    Write-Host "  [OK] Control UI dashboard" -ForegroundColor Green
    Write-Host "  [OK] Native modules (sharp, sqlite-vec, node-pty)" -ForegroundColor Green
    Write-Host "  [OK] Chinese/English installer" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Set plugins.slots.memory = 'none' in config to avoid errors." -ForegroundColor Yellow
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "BUILD FAILED! Check errors above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
