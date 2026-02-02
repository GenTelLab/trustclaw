# OpenClaw SecurityAudit-CN 独立安装包一键构建脚本
# 包含完整的 OpenClaw CLI，无需额外安装 Node.js
# 使用方法: powershell -ExecutionPolicy Bypass -File build-standalone.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  OpenClaw SecurityAudit-CN 独立安装包构建  " -ForegroundColor Cyan
Write-Host "  (包含完整 CLI，无需安装 Node.js)         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Get-Item "$scriptDir\..\..").FullName
$appDir = $scriptDir

Write-Host "[信息] 脚本目录: $scriptDir" -ForegroundColor Gray
Write-Host "[信息] 项目根目录: $rootDir" -ForegroundColor Gray
Write-Host ""

# 步骤 1: 检查 Node.js
Write-Host "[1/9] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "       Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "       错误: 未安装 Node.js，请先安装 Node.js 22+" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# 步骤 2: 检查 pnpm
Write-Host "[2/9] 检查 pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "       pnpm 版本: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "       未安装 pnpm，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "       错误: pnpm 安装失败" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
}

# 步骤 3: 安装主项目依赖
Write-Host "[3/9] 安装主项目依赖..." -ForegroundColor Yellow
Set-Location $rootDir
pnpm install 2>&1 | Out-Null
Write-Host "       依赖安装完成" -ForegroundColor Green

# 步骤 4: 构建主项目 (TypeScript)
Write-Host "[4/9] 构建 OpenClaw 主项目 (TypeScript)..." -ForegroundColor Yellow
npx tsc -p tsconfig.json 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       警告: TypeScript 构建可能有问题，继续..." -ForegroundColor Yellow
}
# 运行构建后处理脚本
node --import tsx scripts/copy-hook-metadata.ts 2>&1 | Out-Null
node --import tsx scripts/write-build-info.ts 2>&1 | Out-Null
Write-Host "       主项目构建完成" -ForegroundColor Green

# 步骤 5: 构建 Control UI
Write-Host "[5/9] 构建 Control UI..." -ForegroundColor Yellow
Set-Location "$rootDir\ui"
pnpm build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       错误: UI 构建失败" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}
Write-Host "       Control UI 构建完成" -ForegroundColor Green

# 步骤 6: 使用 esbuild 打包 CLI 成单文件 bundle
Write-Host "[6/9] 打包 CLI 成单文件 bundle (esbuild)..." -ForegroundColor Yellow
Set-Location $rootDir

# 检查 esbuild 是否安装
$esbuildPath = "$rootDir\node_modules\esbuild\bin\esbuild"
if (-not (Test-Path $esbuildPath)) {
    Write-Host "       安装 esbuild..." -ForegroundColor Gray
    pnpm add esbuild -D -w 2>&1 | Out-Null
}

# 执行打包
$esbuildArgs = @(
    "dist/entry.js",
    "--bundle",
    "--platform=node",
    "--target=node22",
    "--outfile=dist/openclaw-bundle.mjs",
    "--format=esm",
    "--external:sharp",
    "--external:@napi-rs/canvas",
    "--external:sqlite3",
    "--external:better-sqlite3",
    "--external:node-llama-cpp",
    "--external:@lydell/node-pty",
    "--external:playwright-core",
    "--external:chromium-bidi",
    "--external:sqlite-vec",
    "--external:sqlite-vec-*",
    "--external:@mariozechner/clipboard",
    "--external:@mariozechner/clipboard-*",
    "--external:*.node",
    "--minify"
)
node "$rootDir\node_modules\esbuild\bin\esbuild" $esbuildArgs 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       错误: esbuild 打包失败" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}
$bundleSize = [math]::Round((Get-Item "$rootDir\dist\openclaw-bundle.mjs").Length / 1MB, 2)
Write-Host "       CLI bundle 打包完成 ($bundleSize MB)" -ForegroundColor Green

# 步骤 7: 安装 Electron 打包依赖
Write-Host "[7/9] 安装 Electron 打包依赖..." -ForegroundColor Yellow
Set-Location $appDir

# 清理并重新安装
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "       警告: npm install 可能有问题" -ForegroundColor Yellow
}
Write-Host "       Electron 依赖安装完成" -ForegroundColor Green

# 步骤 8: 准备图标文件
Write-Host "[8/9] 准备图标文件..." -ForegroundColor Yellow
$buildDir = "$appDir\build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null
}
$pngSource = "$appDir\renderer\logo.png"
if (Test-Path $pngSource) {
    Copy-Item $pngSource "$buildDir\icon.png" -Force
    Write-Host "       图标准备完成" -ForegroundColor Green
} else {
    Write-Host "       警告: 未找到图标文件" -ForegroundColor Yellow
}

# 步骤 9: 构建安装包
Write-Host "[9/9] 构建 Windows 独立安装包..." -ForegroundColor Yellow
Write-Host ""

# 清理旧的构建输出
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
}

# 设置 Electron 镜像（加速下载）
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"

# 运行 electron-builder
npx electron-builder --win nsis --x64

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "           构建成功!                        " -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host ""
    
    # 显示生成的文件
    $distDir = "$appDir\dist"
    $installerFile = Get-ChildItem $distDir -Filter "*.exe" | Where-Object { $_.Name -notmatch "uninstaller" } | Select-Object -First 1
    
    if ($installerFile) {
        $sizeMB = [math]::Round($installerFile.Length / 1MB, 2)
        Write-Host "生成的安装包:" -ForegroundColor Cyan
        Write-Host "  文件: $($installerFile.Name)" -ForegroundColor White
        Write-Host "  大小: $sizeMB MB" -ForegroundColor White
        Write-Host "  位置: $($installerFile.FullName)" -ForegroundColor White
        
        # 复制到项目根目录
        $targetPath = "$rootDir\$($installerFile.Name)"
        Copy-Item $installerFile.FullName $targetPath -Force
        Write-Host ""
        Write-Host "已复制到项目根目录:" -ForegroundColor Cyan
        Write-Host "  $targetPath" -ForegroundColor White
        
        # 打开输出目录
        Write-Host ""
        Write-Host "正在打开安装包所在目录..." -ForegroundColor Gray
        Start-Process explorer.exe $rootDir
    }
    
    Write-Host ""
    Write-Host "安装包特性:" -ForegroundColor Cyan
    Write-Host "  ✓ 包含完整 OpenClaw CLI (无需安装 Node.js)" -ForegroundColor Green
    Write-Host "  ✓ 包含 Control UI 控制界面" -ForegroundColor Green
    Write-Host "  ✓ 包含 native 模块 (sharp, sqlite-vec)" -ForegroundColor Green
    Write-Host "  ✓ 支持中文/英文安装界面" -ForegroundColor Green
    Write-Host "  ✓ 可自定义安装目录" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "构建失败! 请检查上方错误信息" -ForegroundColor Red
}

Write-Host ""
Read-Host "按 Enter 键退出"
