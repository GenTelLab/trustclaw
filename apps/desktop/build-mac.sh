#!/bin/bash
# TrustClaw macOS Installer 构建脚本
# 必须在 macOS 上运行

set -e

echo ""
echo "============================================="
echo "  TrustClaw macOS 构建工具  "
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
echo "[1/10] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "   ❌ 未安装 Node.js，请先安装 Node.js 22+"
    exit 1
fi
echo "   ✓ Node.js 版本: $(node --version)"

# 步骤 2: 检查主项目构建状态
echo "[2/10] 检查主项目构建状态..."
if [ -f "$ROOT_DIR/dist/entry.js" ]; then
    echo "   ✓ 已构建"
else
    echo "   需要构建主项目，请先运行: pnpm build"
    exit 1
fi

# 步骤 3: 检查 Control UI
echo "[3/10] 检查 Control UI 构建状态..."
if [ -f "$ROOT_DIR/dist/control-ui/index.html" ]; then
    echo "   ✓ 已构建"
else
    echo "   需要构建 Control UI，请先运行: cd ui && pnpm build"
    exit 1
fi

# 步骤 4: 准备 default-openclaw 目录
echo "[4/10] 准备默认 .openclaw 目录..."

# 生成随机 token
RANDOM_TOKEN=$(uuidgen | tr -d '-')$(uuidgen | tr -d '-' | cut -c1-16)
echo "   Token: ${RANDOM_TOKEN:0:8}..."

# 源 .openclaw 目录（macOS 路径）
SOURCE_OPENCLAW="$HOME/.openclaw"

# 清理并创建目标目录
rm -rf "$APP_DIR/default-openclaw"
mkdir -p "$APP_DIR/default-openclaw"

# 复制 workspace 目录（排除 memory 内容）
if [ -d "$SOURCE_OPENCLAW/workspace" ]; then
    cp -r "$SOURCE_OPENCLAW/workspace" "$APP_DIR/default-openclaw/workspace"
    # 清空 memory 目录
    rm -rf "$APP_DIR/default-openclaw/workspace/memory"
    mkdir -p "$APP_DIR/default-openclaw/workspace/memory"
    echo "   ✓ 复制 workspace 完成（记忆已清空）"
fi

# 复制 agents 结构（不含会话内容）
if [ -d "$SOURCE_OPENCLAW/agents" ]; then
    mkdir -p "$APP_DIR/default-openclaw/agents/main/agent"
    mkdir -p "$APP_DIR/default-openclaw/agents/main/sessions"
    if [ -d "$SOURCE_OPENCLAW/agents/main/agent" ]; then
        cp -r "$SOURCE_OPENCLAW/agents/main/agent/"* "$APP_DIR/default-openclaw/agents/main/agent/" 2>/dev/null || true
    fi
    # 创建空的 sessions.json
    echo '{"sessions":[]}' > "$APP_DIR/default-openclaw/agents/main/sessions/sessions.json"
    echo "   ✓ 复制 agents 完成（会话历史已清空）"
fi

# 复制 cron jobs
if [ -f "$SOURCE_OPENCLAW/cron/jobs.json" ]; then
    mkdir -p "$APP_DIR/default-openclaw/cron"
    cp "$SOURCE_OPENCLAW/cron/jobs.json" "$APP_DIR/default-openclaw/cron/"
    echo "   ✓ 复制 cron 完成"
fi

# 创建修改后的 openclaw.json
if [ -f "$SOURCE_OPENCLAW/openclaw.json" ]; then
    # 使用 node 处理 JSON（比 jq 更可靠）
    node -e "
        const fs = require('fs');
        const json = JSON.parse(fs.readFileSync('$SOURCE_OPENCLAW/openclaw.json', 'utf8'));
        json.gateway = json.gateway || {};
        json.gateway.auth = json.gateway.auth || {};
        json.gateway.auth.token = '$RANDOM_TOKEN';
        json.agents = json.agents || {};
        json.agents.defaults = json.agents.defaults || {};
        json.agents.defaults.workspace = '__USER_WORKSPACE__';
        if (json.meta) json.meta.lastTouchedAt = new Date().toISOString();
        fs.writeFileSync('$APP_DIR/default-openclaw/openclaw.json', JSON.stringify(json, null, 2));
    "
    echo "   ✓ 配置文件已生成"
fi

# 步骤 5: 准备 packaged-openclaw 目录
echo "[5/10] 准备 packaged-openclaw 目录..."
if [ ! -f "$APP_DIR/packaged-openclaw/dist/entry.js" ]; then
    echo "   准备目录中..."
    
    # 清理旧目录
    rm -rf "$APP_DIR/packaged-openclaw"
    mkdir -p "$APP_DIR/packaged-openclaw"
    
    # 复制 dist 目录
    cp -r "$ROOT_DIR/dist" "$APP_DIR/packaged-openclaw/dist"
    
    # 创建 package.json（只包含生产依赖）
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$ROOT_DIR/package.json', 'utf8'));
        const prodPkg = {
            name: 'openclaw-runtime',
            version: pkg.version,
            type: 'module',
            dependencies: pkg.dependencies
        };
        fs.writeFileSync('$APP_DIR/packaged-openclaw/package.json', JSON.stringify(prodPkg, null, 2));
    "
    
    # 安装生产依赖
    echo "   安装生产环境依赖..."
    cd "$APP_DIR/packaged-openclaw"
    npm install --omit=dev --legacy-peer-deps 2>&1 | grep -v "^npm warn" || true
    cd "$APP_DIR"
    
    # 复制 @mariozechner 包（npm 版本可能不完整）
    echo "   复制 @mariozechner 包..."
    if [ -d "$ROOT_DIR/node_modules/@mariozechner" ]; then
        rm -rf "$APP_DIR/packaged-openclaw/node_modules/@mariozechner"
        cp -r "$ROOT_DIR/node_modules/@mariozechner" "$APP_DIR/packaged-openclaw/node_modules/"
    fi
    
    # 复制 native 模块（从 pnpm 缓存）
    echo "   复制 native 模块..."
    PNPM_STORE="$ROOT_DIR/node_modules/.pnpm"
    
    copy_pnpm_module() {
        local pnpm_path="$1"
        local target_name="$2"
        local src="$PNPM_STORE/$pnpm_path"
        local dest="$APP_DIR/packaged-openclaw/node_modules/$target_name"
        
        if [ -d "$src" ]; then
            mkdir -p "$(dirname "$dest")"
            rm -rf "$dest"
            cp -r "$src" "$dest"
            echo "   ✓ $target_name"
        fi
    }
    
    copy_pnpm_module "sharp@0.34.5/node_modules/sharp" "sharp"
    copy_pnpm_module "@img+sharp-darwin-arm64@0.34.5/node_modules/@img/sharp-darwin-arm64" "@img/sharp-darwin-arm64"
    copy_pnpm_module "@img+sharp-darwin-x64@0.34.5/node_modules/@img/sharp-darwin-x64" "@img/sharp-darwin-x64"
    copy_pnpm_module "sqlite-vec@0.1.7-alpha.2/node_modules/sqlite-vec" "sqlite-vec"
    copy_pnpm_module "@mariozechner+jiti@2.6.5/node_modules/@mariozechner/jiti" "@mariozechner/jiti"
    copy_pnpm_module "@lydell+node-pty@1.2.0-beta.3/node_modules/@lydell/node-pty" "@lydell/node-pty"
    
    echo "   ✓ 完成"
else
    echo "   ✓ 已存在，跳过"
fi

# 步骤 6: 清理 node_modules
echo "[6/10] 清理 node_modules 减少体积..."
NODE_MODULES="$APP_DIR/packaged-openclaw/node_modules"
if [ -d "$NODE_MODULES" ]; then
    # 删除不需要的文件
    find "$NODE_MODULES" -name "*.d.ts" -delete 2>/dev/null || true
    find "$NODE_MODULES" -name "*.d.ts.map" -delete 2>/dev/null || true
    find "$NODE_MODULES" -name "*.map" -delete 2>/dev/null || true
    find "$NODE_MODULES" -name "*.md" ! -name "package.json" -delete 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "test" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "__tests__" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "example" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true
    find "$NODE_MODULES" -type d -empty -delete 2>/dev/null || true
    echo "   ✓ 清理完成"
fi

# 步骤 7: 准备图标文件
echo "[7/10] 准备图标文件..."

BUILD_DIR="$APP_DIR/build"
mkdir -p "$BUILD_DIR"

PNG_SOURCE="$APP_DIR/renderer/logo.png"
PNG_DEST="$BUILD_DIR/icon.png"
ICNS_DEST="$BUILD_DIR/icon.icns"

if [ -f "$PNG_SOURCE" ]; then
    cp "$PNG_SOURCE" "$PNG_DEST"
    
    # 生成 macOS .icns 图标
    if [ ! -f "$ICNS_DEST" ]; then
        ICONSET_DIR="$BUILD_DIR/icon.iconset"
        mkdir -p "$ICONSET_DIR"
        
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
        
        iconutil -c icns "$ICONSET_DIR" -o "$ICNS_DEST" 2>/dev/null || cp "$PNG_SOURCE" "$ICNS_DEST"
        rm -rf "$ICONSET_DIR"
    fi
    echo "   ✓ 图标已准备"
else
    echo "   ⚠ 警告: 未找到源图标文件 $PNG_SOURCE"
fi

# 步骤 8: 安装 Electron 依赖
echo "[8/10] 安装打包依赖..."
cd "$APP_DIR"
npm install
echo "   ✓ 依赖安装完成"

# 步骤 9: 禁用签名（如果没有证书）
echo "[9/10] 检查签名配置..."
if [ -z "$CSC_LINK" ] && [ -z "$CSC_NAME" ]; then
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    echo "   ⚠ 未配置签名证书，将跳过签名"
else
    echo "   ✓ 签名证书已配置"
fi

# 步骤 10: 构建 DMG
echo "[10/10] 构建 macOS DMG..."
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
        echo ""
        echo "注意: 未签名的应用，用户需要运行以下命令绕过 Gatekeeper:"
        echo "  xattr -cr /Applications/TrustClaw.app"
        
        # 打开输出目录
        open "$DIST_DIR"
    fi
else
    echo ""
    echo "❌ 构建失败! 请检查上方错误信息"
fi

echo ""
