# 准备打包所需的 node_modules 目录
# 复制所有 external 模块到一个干净的目录结构

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..\..").FullName
$outputDir = "$scriptDir\..\packaged-modules"

Write-Host "准备打包模块..." -ForegroundColor Cyan
Write-Host "根目录: $rootDir"
Write-Host "输出目录: $outputDir"

# 清理输出目录
if (Test-Path $outputDir) {
    Remove-Item -Recurse -Force $outputDir
}
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

# 需要复制的模块列表 (pnpm 路径 -> 目标名称)
$modules = @(
    @{ pnpm = "sharp@0.34.5/node_modules/sharp"; name = "sharp" },
    @{ pnpm = "@img+sharp-win32-x64@0.34.5/node_modules/@img/sharp-win32-x64"; name = "@img/sharp-win32-x64" },
    @{ pnpm = "sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec"; name = "sqlite-vec" },
    @{ pnpm = "sqlite-vec-windows-x64@0.1.7-alpha.2/node_modules/sqlite-vec-windows-x64"; name = "sqlite-vec-windows-x64" },
    @{ pnpm = "@mariozechner+clipboard@0.3.0/node_modules/@mariozechner/clipboard"; name = "@mariozechner/clipboard" },
    @{ pnpm = "@mariozechner+clipboard-win32-x64-msvc@0.3.0/node_modules/@mariozechner/clipboard-win32-x64-msvc"; name = "@mariozechner/clipboard-win32-x64-msvc" },
    @{ pnpm = "@lydell+node-pty@1.2.0-beta.3/node_modules/@lydell/node-pty"; name = "@lydell/node-pty" },
    @{ pnpm = "@lydell+node-pty-win32-x64@1.2.0-beta.3/node_modules/@lydell/node-pty-win32-x64"; name = "@lydell/node-pty-win32-x64" }
)

# 在 outputDir 下创建 node_modules 目录
$nodeModulesDir = "$outputDir\node_modules"
New-Item -ItemType Directory -Path $nodeModulesDir -Force | Out-Null

foreach ($mod in $modules) {
    $srcPath = "$rootDir\node_modules\.pnpm\$($mod.pnpm)"
    $destPath = "$nodeModulesDir\$($mod.name)"
    
    if (Test-Path $srcPath) {
        Write-Host "  复制 $($mod.name)..." -ForegroundColor Gray
        
        # 确保目标目录的父目录存在
        $parentDir = Split-Path -Parent $destPath
        if (-not (Test-Path $parentDir)) {
            New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
        }
        
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
    } else {
        Write-Host "  警告: 未找到 $($mod.name) ($srcPath)" -ForegroundColor Yellow
    }
}

# 复制 bundle 到模块目录
$bundleSrc = "$rootDir\dist\openclaw-bundle.mjs"
$bundleDest = "$outputDir\openclaw-bundle.mjs"
if (Test-Path $bundleSrc) {
    Write-Host "  复制 bundle..." -ForegroundColor Gray
    Copy-Item $bundleSrc $bundleDest -Force
}

Write-Host ""
Write-Host "模块准备完成!" -ForegroundColor Green
Write-Host "输出目录: $outputDir"
