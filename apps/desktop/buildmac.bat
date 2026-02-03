@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title TrustClaw macOS 构建工具

echo.
echo =============================================
echo   TrustClaw macOS 构建
echo   (需要在 macOS 上运行才能生成 DMG)
echo =============================================
echo.

cd /d "%~dp0"
set "ROOT_DIR=%~dp0..\.."
set "APP_DIR=%~dp0"

:: Step 1: Check Node.js
echo [1/6] 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo        错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo        Node.js: %%i

:: Step 2: Check if dist exists
echo [2/6] 检查主项目构建状态...
if exist "%ROOT_DIR%\dist\entry.js" (
    echo        已构建，跳过
) else (
    echo        需要构建主项目，请先运行: npm run build
    pause
    exit /b 1
)

:: Step 3: Check control-ui
echo [3/6] 检查 Control UI 构建状态...
if exist "%ROOT_DIR%\dist\control-ui\index.html" (
    echo        已构建，跳过
) else (
    echo        需要构建 Control UI，请先运行: cd ui ^&^& npm run build
    pause
    exit /b 1
)

:: Step 4: Prepare default .openclaw directory
echo [4/8] 准备默认 .openclaw 目录...

:: Generate random token
for /f "tokens=*" %%i in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N').Substring(0,16)"') do set "RANDOM_TOKEN=%%i"
echo        Token: %RANDOM_TOKEN:~0,8%...

:: Source .openclaw directory (change this path if needed)
set "SOURCE_OPENCLAW=C:\Users\13018\.openclaw1"

:: Clean and create target directory
if exist "%APP_DIR%\default-openclaw" rmdir /s /q "%APP_DIR%\default-openclaw"
mkdir "%APP_DIR%\default-openclaw"

:: Copy workspace directory (excluding memory content)
if exist "%SOURCE_OPENCLAW%\workspace" (
    xcopy "%SOURCE_OPENCLAW%\workspace" "%APP_DIR%\default-openclaw\workspace\" /E /I /Y /Q >nul 2>&1
    :: Clear memory directory (no conversation history)
    if exist "%APP_DIR%\default-openclaw\workspace\memory" (
        del /Q "%APP_DIR%\default-openclaw\workspace\memory\*" 2>nul
    ) else (
        mkdir "%APP_DIR%\default-openclaw\workspace\memory" 2>nul
    )
    echo        复制 workspace 完成（记忆已清空）
)

:: Copy agents structure (without sessions content)
if exist "%SOURCE_OPENCLAW%\agents" (
    mkdir "%APP_DIR%\default-openclaw\agents\main\agent" 2>nul
    mkdir "%APP_DIR%\default-openclaw\agents\main\sessions" 2>nul
    if exist "%SOURCE_OPENCLAW%\agents\main\agent" (
        xcopy "%SOURCE_OPENCLAW%\agents\main\agent" "%APP_DIR%\default-openclaw\agents\main\agent\" /E /I /Y /Q >nul 2>&1
    )
    :: Create empty sessions.json (no conversation history)
    echo {"sessions":[]} > "%APP_DIR%\default-openclaw\agents\main\sessions\sessions.json"
    echo        复制 agents 完成（会话历史已清空）
)

:: Copy cron jobs
if exist "%SOURCE_OPENCLAW%\cron\jobs.json" (
    mkdir "%APP_DIR%\default-openclaw\cron" 2>nul
    copy "%SOURCE_OPENCLAW%\cron\jobs.json" "%APP_DIR%\default-openclaw\cron\" /Y >nul 2>&1
    echo        复制 cron 完成
)

:: Create modified openclaw.json with placeholders
powershell -Command "$json = Get-Content '%SOURCE_OPENCLAW%\openclaw.json' -Raw | ConvertFrom-Json; $json.gateway.auth.token = '__RANDOM_TOKEN__'; $json.agents.defaults.workspace = '__USER_WORKSPACE__'; if ($json.meta) { $json.meta.lastTouchedAt = (Get-Date).ToString('o') }; $json | ConvertTo-Json -Depth 20 | Set-Content '%APP_DIR%\default-openclaw\openclaw.json' -Encoding UTF8"

:: Replace placeholder with actual random token in the file
powershell -Command "(Get-Content '%APP_DIR%\default-openclaw\openclaw.json' -Raw) -replace '__RANDOM_TOKEN__', '%RANDOM_TOKEN%' | Set-Content '%APP_DIR%\default-openclaw\openclaw.json' -Encoding UTF8"

echo        配置文件已生成（token 和 workspace 路径将在安装时替换）

:: Step 5: Prepare packaged-openclaw
echo [5/8] 准备 packaged-openclaw 目录...
if not exist "packaged-openclaw\dist\entry.js" (
    echo        复制文件中...
    if not exist "packaged-openclaw" mkdir "packaged-openclaw"
    xcopy "%ROOT_DIR%\dist" "packaged-openclaw\dist\" /E /I /Y /Q >nul 2>&1
    xcopy "%ROOT_DIR%\node_modules" "packaged-openclaw\node_modules\" /E /I /Y /Q >nul 2>&1
    copy "%ROOT_DIR%\package.json" "packaged-openclaw\" /Y >nul 2>&1
    echo        完成
) else (
    echo        已存在，跳过
)

:: Step 6: Clean node_modules (remove unnecessary files)
echo [6/8] 清理 node_modules 减少文件数量...
powershell -ExecutionPolicy Bypass -File "scripts\clean-node-modules.ps1" -Path "packaged-openclaw\node_modules"

:: Step 7: Install app dependencies
echo [7/8] 安装依赖...
call npm install --silent 2>nul
echo        OK

:: Step 8: Build macOS installer
echo [8/8] 构建 macOS 安装包...
echo.
echo        注意: 在 Windows 上构建 Mac 版本有以下限制:
echo        - 无法生成 DMG 格式 (需要 macOS)
echo        - 无法进行代码签名和公证
echo        - 将生成 .zip 格式的 Mac 应用
echo.

:: Build for macOS (zip format, works on Windows)
call npx electron-builder --mac zip --x64

if errorlevel 1 (
    echo.
    echo =============================================
    echo   构建失败！
    echo =============================================
    echo.
    echo   如果需要完整的 DMG 安装包，请在 macOS 上运行:
    echo   cd apps/desktop ^&^& ./build-mac.sh
    echo.
) else (
    echo.
    echo =============================================
    echo           构建成功！
    echo =============================================
    echo.
    echo 安装包位置: %APP_DIR%dist
    echo.
    echo 注意: 生成的是 .zip 格式，如需 DMG 请在 macOS 上构建
    echo.
    
    :: Open dist folder
    if exist "dist\*.zip" (
        explorer "dist"
    )
)

echo.
pause
