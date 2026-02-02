# OpenClaw Windows GUI 启动脚本
# 自动检查并修复 Electron 安装

$ErrorActionPreference = "Stop"

Write-Host "检查 Electron 安装..." -ForegroundColor Cyan

# 检查 Electron 是否存在
$electronPath = "..\..\node_modules\.pnpm\electron@32.3.3\node_modules\electron"
$electronExe = "$electronPath\dist\electron.exe"

if (-not (Test-Path $electronExe)) {
    Write-Host "Electron 二进制文件未找到，正在下载..." -ForegroundColor Yellow
    
    # 设置镜像源（如果需要）
    if (-not $env:ELECTRON_MIRROR) {
        $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
    }
    
    # 运行安装脚本
    $installScript = "$electronPath\install.js"
    if (Test-Path $installScript) {
        Write-Host "运行 Electron 安装脚本..." -ForegroundColor Yellow
        node $installScript
    } else {
        Write-Host "错误: 找不到 Electron 安装脚本" -ForegroundColor Red
        Write-Host "请运行: pnpm install --force" -ForegroundColor Yellow
        exit 1
    }
    
    # 再次检查
    if (-not (Test-Path $electronExe)) {
        Write-Host "错误: Electron 下载失败" -ForegroundColor Red
        Write-Host "请尝试手动安装:" -ForegroundColor Yellow
        Write-Host "  1. 设置镜像: `$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'" -ForegroundColor Yellow
        Write-Host "  2. 运行: pnpm install electron@32.3.3 --save-dev --force" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Electron 已就绪，启动应用..." -ForegroundColor Green

# 启动 Electron
& $electronExe .
