@echo off
chcp 65001 >nul
title OpenClaw SecurityAudit-CN 独立安装包构建工具
echo.
echo =============================================
echo   OpenClaw SecurityAudit-CN 独立安装包构建
echo   (包含完整 CLI，无需安装 Node.js)
echo   双击此文件即可自动构建 EXE 安装包
echo =============================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0build-standalone.ps1"
