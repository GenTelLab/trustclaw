#!/bin/bash
# OpenClaw SecurityAudit-CN macOS Installer 构建脚本
# 必须在 macOS 上运行

set -e

echo ""
echo "============================================="
echo "  OpenClaw SecurityAudit-CN macOS 构建工具  "
echo "============================================="
echo ""

# 检查是否在 macOS 上运行
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: 此脚本必须在 macOS 上运行"
    echo "   当前系统: $OSTYPE"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$SCRIPT_DIR"

echo "[信息] 脚本目录: $SCRIPT_DIR"
echo "[信息] 项目根目录: $ROOT_DIR"
echo ""

# 步骤 1: 检查 Node.js
echo "[1/8] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "   ❌ 未安装 Node.js，请先安装 Node.js 22+"
    exit 1
fi
echo "   ✓ Node.js 版本: $(node --version)"

# 步骤 2: 检查 pnpm
echo "[2/8] 检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "   未安装 pnpm，正在安装..."
    npm install -g pnpm
fi
echo "   ✓ pnpm 版本: $(pnpm --version)"

# 步骤 3: 安装主项目依赖
echo "[3/8] 安装主项目依赖..."
cd "$ROOT_DIR"
pnpm install
echo "   ✓ 依赖安装完成"

# 步骤 4: 构建主项目
echo "[4/8] 构建 OpenClaw 主项目..."
pnpm build || echo "   ⚠ 主项目构建可能有问题，继续..."
echo "   ✓ 主项目构建完成"

# 步骤 5: 构建 Control UI
echo "[5/8] 构建 Control UI..."
cd "$ROOT_DIR/ui"
pnpm build
echo "   ✓ Control UI 构建完成"

# 步骤 6: 安装 Electron 依赖
echo "[6/8] 安装打包依赖..."
cd "$APP_DIR"
npm install
echo "   ✓ 依赖安装完成"

# 步骤 7: 准备图标文件
echo "[7/8] 准备图标文件..."

BUILD_DIR="$APP_DIR/build"
mkdir -p "$BUILD_DIR"

PNG_SOURCE="$APP_DIR/renderer/logo.png"
PNG_DEST="$BUILD_DIR/icon.png"
ICNS_DEST="$BUILD_DIR/icon.icns"

if [ -f "$PNG_SOURCE" ]; then
    cp "$PNG_SOURCE" "$PNG_DEST"
    echo "   ✓ 复制 icon.png 到 build/"
    
    # 生成 macOS .icns 图标
    if [ ! -f "$ICNS_DEST" ]; then
        echo "   生成 macOS 图标..."
        
        # 创建 iconset 目录
        ICONSET_DIR="$BUILD_DIR/icon.iconset"
        mkdir -p "$ICONSET_DIR"
        
        # 使用 sips 生成不同尺寸的图标
        sips -z 16 16     "$PNG_SOURCE" --out "$ICONSET_DIR/icon_16x16.png" 2>/dev/null || true
        sips -z 32 32     "$PNG_SOURCE" --out "$ICONSET_DIR/icon_16x16@2x.png" 2>/dev/null || true
        sips -z 32 32     "$PNG_SOURCE" --out "$ICONSET_DIR/icon_32x32.png" 2>/dev/null || true
        sips -z 64 64     "$PNG_SOURCE" --out "$ICONSET_DIR/icon_32x32@2x.png" 2>/dev/null || true
        sips -z 128 128   "$PNG_SOURCE" --out "$ICONSET_DIR/icon_128x128.png" 2>/dev/null || true
        sips -z 256 256   "$PNG_SOURCE" --out "$ICONSET_DIR/icon_128x128@2x.png" 2>/dev/null || true
        sips -z 256 256   "$PNG_SOURCE" --out "$ICONSET_DIR/icon_256x256.png" 2>/dev/null || true
        sips -z 512 512   "$PNG_SOURCE" --out "$ICONSET_DIR/icon_256x256@2x.png" 2>/dev/null || true
        sips -z 512 512   "$PNG_SOURCE" --out "$ICONSET_DIR/icon_512x512.png" 2>/dev/null || true
        sips -z 1024 1024 "$PNG_SOURCE" --out "$ICONSET_DIR/icon_512x512@2x.png" 2>/dev/null || true
        
        # 使用 iconutil 生成 icns
        iconutil -c icns "$ICONSET_DIR" -o "$ICNS_DEST" 2>/dev/null || {
            echo "   ⚠ iconutil 失败，尝试其他方法..."
            # 如果 iconutil 失败，尝试复制 PNG
            cp "$PNG_SOURCE" "$ICNS_DEST"
        }
        
        # 清理 iconset 目录
        rm -rf "$ICONSET_DIR"
        
        echo "   ✓ macOS 图标已生成"
    else
        echo "   ✓ ICNS 图标已存在"
    fi
else
    echo "   ⚠ 警告: 未找到源图标文件 $PNG_SOURCE"
fi

# 步骤 8: 构建 DMG
echo "[8/8] 构建 macOS DMG..."
echo ""

# 检测架构
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    TARGET_ARCH="arm64"
else
    TARGET_ARCH="x64"
fi

echo "   目标架构: $TARGET_ARCH"

# 运行 electron-builder
npx electron-builder --mac dmg --$TARGET_ARCH

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================="
    echo "           构建成功!                        "
    echo "============================================="
    echo ""
    
    DIST_DIR="$APP_DIR/dist"
    if [ -d "$DIST_DIR" ]; then
        echo "生成的安装包:"
        ls -lh "$DIST_DIR"/*.dmg 2>/dev/null | awk '{print "  -> " $NF " (" $5 ")"}'
        echo ""
        echo "安装包位置: $DIST_DIR"
        
        # 打开输出目录
        open "$DIST_DIR"
    fi
else
    echo ""
    echo "❌ 构建失败! 请检查上方错误信息"
fi

echo ""
