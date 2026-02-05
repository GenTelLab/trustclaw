@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title TrustClaw Windows 构建工具

echo.
echo =============================================
echo   TrustClaw Windows 构建
echo   (包含完整 CLI，无需安装 Node.js)
echo =============================================
echo.

cd /d "%~dp0"
set "ROOT_DIR=%~dp0..\.."
set "APP_DIR=%~dp0"

:: Step 1: Check Node.js
echo [1/10] 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo        错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo        Node.js: %%i

:: Step 2: Build main project (TypeScript)
echo [2/10] 编译主项目 (TypeScript)...
pushd "%ROOT_DIR%"
call npx tsc -p tsconfig.json
if errorlevel 1 (
    echo        错误: TypeScript 编译失败
    popd
    pause
    exit /b 1
)
:: Run post-build scripts
call node --import tsx scripts/copy-hook-metadata.ts 2>nul
call node --import tsx scripts/write-build-info.ts 2>nul
popd
echo        编译完成

:: Step 3: Build control-ui
echo [3/10] 编译 Control UI...
if not exist "%ROOT_DIR%\dist\control-ui\index.html" (
    pushd "%ROOT_DIR%\ui"
    call npm run build
    if errorlevel 1 (
        echo        错误: Control UI 编译失败
        popd
        pause
        exit /b 1
    )
    popd
    echo        编译完成
) else (
    echo        已存在，跳过（如需重新编译，请删除 dist\control-ui 目录）
)

:: Step 4: Prepare default .openclaw directory
echo [4/10] 准备默认 .openclaw 目录...

:: Check if default-openclaw directory exists
if not exist "%APP_DIR%\default-openclaw" (
    echo        错误: default-openclaw 目录不存在
    echo        请先准备好 apps\desktop\default-openclaw 目录
    pause
    exit /b 1
)

if not exist "%APP_DIR%\default-openclaw\openclaw.json" (
    echo        错误: default-openclaw\openclaw.json 不存在
    pause
    exit /b 1
)

:: Generate random token
for /f "tokens=*" %%i in ('powershell -Command "[System.Guid]::NewGuid().ToString('N') + [System.Guid]::NewGuid().ToString('N').Substring(0,16)"') do set "RANDOM_TOKEN=%%i"
echo        Token: %RANDOM_TOKEN:~0,8%...

:: Update token in openclaw.json (replace __RANDOM_TOKEN__ placeholder or existing token)
powershell -Command "$json = Get-Content '%APP_DIR%\default-openclaw\openclaw.json' -Raw | ConvertFrom-Json; if ($json.gateway -and $json.gateway.auth) { $json.gateway.auth.token = '__RANDOM_TOKEN__' }; if ($json.meta) { $json.meta.lastTouchedAt = (Get-Date).ToString('o') }; $content = $json | ConvertTo-Json -Depth 20; [System.IO.File]::WriteAllText('%APP_DIR%\default-openclaw\openclaw.json', $content, [System.Text.UTF8Encoding]::new($false))"

:: Replace placeholder with actual random token
powershell -Command "$content = (Get-Content '%APP_DIR%\default-openclaw\openclaw.json' -Raw) -replace '__RANDOM_TOKEN__', '%RANDOM_TOKEN%'; [System.IO.File]::WriteAllText('%APP_DIR%\default-openclaw\openclaw.json', $content, [System.Text.UTF8Encoding]::new($false))"

:: Clear memory files (no conversation history in release build)
if exist "%APP_DIR%\default-openclaw\workspace\memory" (
    del /Q "%APP_DIR%\default-openclaw\workspace\memory\*" 2>nul
    echo        已清空 memory 目录
)

:: Clear session files (no conversation history in release build)
if exist "%APP_DIR%\default-openclaw\agents\main\sessions" (
    del /Q "%APP_DIR%\default-openclaw\agents\main\sessions\*.jsonl" 2>nul
    echo {"sessions":[]} > "%APP_DIR%\default-openclaw\agents\main\sessions\sessions.json"
    echo        已清空 sessions 目录
)

echo        使用 default-openclaw 目录完成

:: Step 5: Prepare packaged-openclaw (使用 PowerShell 脚本正确处理 pnpm 依赖)
echo [5/10] 准备 packaged-openclaw 目录...
if exist "packaged-openclaw" (
    echo        删除旧目录...
    rmdir /s /q "packaged-openclaw"
)
echo        使用 prepare-openclaw.ps1 准备目录...
powershell -ExecutionPolicy Bypass -File "scripts\prepare-openclaw.ps1"
if errorlevel 1 (
    echo        错误: prepare-openclaw.ps1 执行失败
    pause
    exit /b 1
)
echo        完成

:: Step 6: Clean node_modules (remove unnecessary files)
echo [6/10] 清理 node_modules 减少文件数量...
if exist "packaged-openclaw\node_modules" (
    powershell -ExecutionPolicy Bypass -File "scripts\clean-node-modules.ps1" -Path "packaged-openclaw\node_modules"
)

:: Step 7: Verify modules integrity
echo [7/10] 验证模块完整性...
powershell -ExecutionPolicy Bypass -File "scripts\verify-modules.ps1" -Path "packaged-openclaw"
if errorlevel 1 (
    echo        错误: 模块验证失败，请检查上方错误信息
    pause
    exit /b 1
)

:: Step 8: Compress packaged-openclaw to zip (much faster installation)
echo [8/10] 压缩 packaged-openclaw 加速安装...
if exist "packaged-openclaw.zip" del "packaged-openclaw.zip"
powershell -Command "Compress-Archive -Path 'packaged-openclaw\*' -DestinationPath 'packaged-openclaw.zip' -CompressionLevel Optimal -Force"
if errorlevel 1 (
    echo        错误: 压缩失败
    pause
    exit /b 1
)
for %%f in (packaged-openclaw.zip) do echo        压缩完成: %%~zf bytes

:: Step 9: Check embedded Node.js
echo [9/10] 检查嵌入式 Node.js...
if not exist "nodejs\node.exe" (
    echo        错误: nodejs\node.exe 不存在
    echo        请下载 Node.js Windows 版本并解压到 nodejs 目录
    pause
    exit /b 1
)
echo        OK

:: Step 10: Install dependencies and build
echo [10/10] 安装依赖并构建安装包...
call npm install --silent 2>nul
echo.

call npx electron-builder --win nsis --x64

if errorlevel 1 (
    echo.
    echo =============================================
    echo   构建失败！请检查上方错误信息
    echo =============================================
) else (
    echo.
    echo =============================================
    echo           构建成功！
    echo =============================================
    echo.
    echo 安装包位置: %APP_DIR%dist
    echo.
    
    for %%f in (dist\*.exe) do (
        echo 生成文件: %%f
    )
    echo.
    
    if exist "dist\*.exe" (
        explorer "dist"
    )
)

echo.
pause
