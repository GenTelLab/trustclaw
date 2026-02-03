# Prepare openclaw directory for packaging
# Contains dist + production node_modules

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..\..").FullName
$outputDir = Join-Path $scriptDir "..\packaged-openclaw" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $outputDir) {
    $outputDir = "$scriptDir\..\packaged-openclaw"
}

Write-Host "Preparing OpenClaw package directory..." -ForegroundColor Cyan
Write-Host "Root: $rootDir"
Write-Host "Output: $outputDir"

# Clean output directory
if (Test-Path $outputDir) {
    Remove-Item -Recurse -Force $outputDir
}
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# 1. Copy dist directory
Write-Host "  Copying dist..." -ForegroundColor Gray
$distSrc = "$rootDir\dist"
$distDest = "$outputDir\dist"
if (Test-Path $distSrc) {
    Copy-Item -Path $distSrc -Destination $distDest -Recurse -Force
} else {
    Write-Host "  ERROR: dist not found, run pnpm build first" -ForegroundColor Red
    exit 1
}

# 2. Create package.json (production deps only)
Write-Host "  Creating production package.json..." -ForegroundColor Gray
$pkgContent = Get-Content "$rootDir\package.json" -Raw
$pkgJson = $pkgContent | ConvertFrom-Json

# Extract dependencies as JSON string
$depsJson = $pkgJson.dependencies | ConvertTo-Json -Compress
$version = $pkgJson.version

# Write package.json directly
$packageJson = @"
{
  "name": "openclaw-runtime",
  "version": "$version",
  "type": "module",
  "dependencies": $depsJson
}
"@
# Write UTF-8 without BOM
[System.IO.File]::WriteAllText("$outputDir\package.json", $packageJson, [System.Text.UTF8Encoding]::new($false))

# 3. Install production dependencies
Write-Host "  Installing production deps (npm install --omit=dev)..." -ForegroundColor Gray
Push-Location $outputDir
try {
    # Redirect stderr to stdout to avoid PowerShell treating npm warnings as errors
    $env:npm_config_loglevel = "error"
    $result = npm install --omit=dev --legacy-peer-deps 2>&1
    $result | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: npm install may have issues, continuing..." -ForegroundColor Yellow
    }
}
finally {
    Pop-Location
}

# 4. Copy modules from pnpm (native modules + packages with registry issues)
Write-Host "  Copying modules from pnpm..." -ForegroundColor Gray
$nodeModulesDir = "$outputDir\node_modules"

# Module list: pnpm_path|target_name
$moduleList = @(
    "sharp@0.34.5/node_modules/sharp|sharp"
    "@img+sharp-win32-x64@0.34.5/node_modules/@img/sharp-win32-x64|@img/sharp-win32-x64"
    "sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec|sqlite-vec"
    "sqlite-vec-windows-x64@0.1.7-alpha.2/node_modules/sqlite-vec-windows-x64|sqlite-vec-windows-x64"
    "@mariozechner+clipboard@0.3.0/node_modules/@mariozechner/clipboard|@mariozechner/clipboard"
    "@mariozechner+clipboard-win32-x64-msvc@0.3.0/node_modules/@mariozechner/clipboard-win32-x64-msvc|@mariozechner/clipboard-win32-x64-msvc"
    "@mariozechner+jiti@2.6.5/node_modules/@mariozechner/jiti|@mariozechner/jiti"
    "@lydell+node-pty@1.2.0-beta.3/node_modules/@lydell/node-pty|@lydell/node-pty"
    "@lydell+node-pty-win32-x64@1.2.0-beta.3/node_modules/@lydell/node-pty-win32-x64|@lydell/node-pty-win32-x64"
)

# Also copy @mariozechner packages directly from root node_modules (npm registry versions may be incomplete)
Write-Host "  Copying @mariozechner packages from root..." -ForegroundColor Gray
$mariozechnerSrc = "$rootDir\node_modules\@mariozechner"
$mariozechnerDest = "$nodeModulesDir\@mariozechner"
if (Test-Path $mariozechnerSrc) {
    if (Test-Path $mariozechnerDest) {
        Remove-Item -Recurse -Force $mariozechnerDest
    }
    Copy-Item -Path $mariozechnerSrc -Destination $mariozechnerDest -Recurse -Force
    Write-Host "    Copied @mariozechner packages" -ForegroundColor DarkGray
}

foreach ($item in $moduleList) {
    $parts = $item.Split("|")
    $pnpmPath = $parts[0]
    $modName = $parts[1]
    
    $srcPath = "$rootDir\node_modules\.pnpm\$pnpmPath"
    $destPath = "$nodeModulesDir\$modName"
    
    if (Test-Path $srcPath) {
        Write-Host "    Copying $modName..." -ForegroundColor DarkGray
        
        $parentDir = Split-Path -Parent $destPath
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        
        if (Test-Path $destPath) {
            Remove-Item -Recurse -Force $destPath
        }
        
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
    }
    else {
        Write-Host "    WARNING: $modName not found" -ForegroundColor Yellow
    }
}

# 5. Show result
$totalSize = (Get-ChildItem -Path $outputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "OpenClaw package directory ready!" -ForegroundColor Green
Write-Host "  Directory: $outputDir"
Write-Host "  Size: $([math]::Round($totalSize, 2)) MB"
