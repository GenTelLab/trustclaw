# 准备打包所需的 openclaw 目录
# 包含完整的 dist + 生产环境 node_modules

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..\..").FullName
$outputDir = "$scriptDir\..\packaged-openclaw"

Write-Host "准备 OpenClaw 打包目录..." -ForegroundColor Cyan
Write-Host "根目录: $rootDir"
Write-Host "输出目录: $outputDir"

# 清理输出目录
if (Test-Path $outputDir) {
    Remove-Item -Recurse -Force $outputDir
}
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# 1. 复制 dist 目录
Write-Host "  复制 dist 目录..." -ForegroundColor Gray
$distSrc = "$rootDir\dist"
$distDest = "$outputDir\dist"
if (Test-Path $distSrc) {
    Copy-Item -Path $distSrc -Destination $distDest -Recurse -Force
} else {
    Write-Host "  错误: dist 目录不存在，请先运行 pnpm build" -ForegroundColor Red
    exit 1
}

# 2. 创建 package.json（只包含生产依赖）
Write-Host "  创建生产环境 package.json..." -ForegroundColor Gray
$pkgSrc = Get-Content "$rootDir\package.json" -Raw | ConvertFrom-Json

# 提取运行时必须的依赖
$prodDeps = @{
    "name" = "openclaw-runtime"
    "version" = $pkgSrc.version
    "type" = "module"
    "dependencies" = @{}
}

# 复制所有 dependencies
if ($pkgSrc.dependencies) {
    foreach ($dep in $pkgSrc.dependencies.PSObject.Properties) {
        $prodDeps.dependencies[$dep.Name] = $dep.Value
    }
}

$prodDeps | ConvertTo-Json -Depth 10 | Set-Content "$outputDir\package.json" -Encoding UTF8

# 3. 安装生产依赖
Write-Host "  安装生产环境依赖 (npm install --omit=dev)..." -ForegroundColor Gray
Push-Location $outputDir
try {
    # 使用 --legacy-peer-deps 避免依赖冲突
    npm install --omit=dev --legacy-peer-deps 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  警告: npm install 可能有问题，继续..." -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}

# 4. 复制 native 模块（从 pnpm 缓存）
Write-Host "  复制 native 模块..." -ForegroundColor Gray
$nodeModulesDir = "$outputDir\node_modules"

$nativeModules = @(
    @{ pnpm = "sharp@0.34.5/node_modules/sharp"; name = "sharp" },
    @{ pnpm = "@img+sharp-win32-x64@0.34.5/node_modules/@img/sharp-win32-x64"; name = "@img/sharp-win32-x64" },
    @{ pnpm = "sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec"; name = "sqlite-vec" },
    @{ pnpm = "sqlite-vec-windows-x64@0.1.7-alpha.2/node_modules/sqlite-vec-windows-x64"; name = "sqlite-vec-windows-x64" },
    @{ pnpm = "@mariozechner+clipboard@0.3.0/node_modules/@mariozechner/clipboard"; name = "@mariozechner/clipboard" },
    @{ pnpm = "@mariozechner+clipboard-win32-x64-msvc@0.3.0/node_modules/@mariozechner/clipboard-win32-x64-msvc"; name = "@mariozechner/clipboard-win32-x64-msvc" },
    @{ pnpm = "@lydell+node-pty@1.2.0-beta.3/node_modules/@lydell/node-pty"; name = "@lydell/node-pty" },
    @{ pnpm = "@lydell+node-pty-win32-x64@1.2.0-beta.3/node_modules/@lydell/node-pty-win32-x64"; name = "@lydell/node-pty-win32-x64" }
)

foreach ($mod in $nativeModules) {
    $srcPath = "$rootDir\node_modules\.pnpm\$($mod.pnpm)"
    $destPath = "$nodeModulesDir\$($mod.name)"
    
    if (Test-Path $srcPath) {
        Write-Host "    复制 $($mod.name)..." -ForegroundColor DarkGray
        
        # 确保目标目录的父目录存在
        $parentDir = Split-Path -Parent $destPath
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        
        # 如果已存在则先删除
        if (Test-Path $destPath) {
            Remove-Item -Recurse -Force $destPath
        }
        
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
    } else {
        Write-Host "    警告: 未找到 $($mod.name)" -ForegroundColor Yellow
    }
}

# 5. 显示结果
$totalSize = (Get-ChildItem -Path $outputDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "OpenClaw 打包目录准备完成!" -ForegroundColor Green
Write-Host "  目录: $outputDir"
Write-Host "  大小: $([math]::Round($totalSize, 2)) MB"
