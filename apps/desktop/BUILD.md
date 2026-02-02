# OpenClaw SecurityAudit-CN 打包指南

本文档介绍如何将应用打包为 **Windows EXE 安装包** 和 **macOS DMG 安装包**。

## 前置要求

| 环境 | Windows | macOS |
|------|---------|-------|
| Node.js | 22+ | 22+ |
| pnpm | 最新版 | 最新版 |
| 操作系统 | Windows 10+ | macOS 12+ |

## 快速打包

### Windows 独立安装包（推荐）

打包包含完整 OpenClaw CLI 的独立安装包，**用户无需安装 Node.js**。

#### 方式一：双击脚本（推荐）

```
双击运行: apps/desktop/build-standalone.bat
```

#### 方式二：命令行

```powershell
cd apps/desktop
powershell -ExecutionPolicy Bypass -File build-standalone.ps1
```

**独立安装包特性：**
- ✅ 包含完整 OpenClaw CLI（使用 esbuild 打包成单文件）
- ✅ 包含 native 模块（sharp 图片处理、sqlite-vec 向量数据库）
- ✅ 用户无需预先安装 Node.js、npm 或 OpenClaw CLI
- ✅ 安装包体积约 90MB

---

### Windows 标准打包

需要用户预先安装 OpenClaw CLI。

#### 方式一：双击脚本

```
双击运行: apps/desktop/build.bat
```

#### 方式二：命令行

```powershell
cd apps/desktop
powershell -ExecutionPolicy Bypass -File build-installer.ps1
```

#### 方式三：NPM 命令

```powershell
cd apps/desktop
npm run build:win
```

### macOS 打包

> ⚠️ **必须在 macOS 上执行**

#### 方式一：Shell 脚本（推荐）

```bash
cd apps/desktop
chmod +x build-mac.sh
./build-mac.sh
```

#### 方式二：NPM 命令

```bash
cd apps/desktop
npm run build:mac
```

## 手动打包步骤

如果自动脚本失败，可以手动执行以下步骤：

### 1. 构建主项目

```bash
# 项目根目录
pnpm install
pnpm build
```

### 2. 构建 Control UI

```bash
cd ui
pnpm build
cd ..
```

### 3. 安装 Electron 依赖

```bash
cd apps/desktop
npm install
```

### 4. 准备图标（可选）

```bash
# 将 PNG 图标复制到 build 目录
mkdir -p build
cp renderer/logo.png build/icon.png
cp renderer/logo.png build/icon.ico  # Windows
# macOS 需要 .icns 文件，build-mac.sh 会自动生成
```

### 5. 打包

```bash
# Windows NSIS 安装包
npm run build:nsis

# Windows 便携版
npm run build:portable

# macOS DMG
npm run build:mac:dmg

# macOS PKG
npm run build:mac:pkg

# 全部平台
npm run build:all
```

## 输出文件

打包完成后，文件位于 `apps/desktop/dist/`：

### Windows
```
dist/
├── OpenClaw SecurityAudit-CN-Setup-2026.1.29.exe  # NSIS 安装包
└── OpenClaw SecurityAudit-CN-Portable-2026.1.29.exe  # 便携版
```

### macOS
```
dist/
├── OpenClaw SecurityAudit-CN-2026.1.29-arm64.dmg  # Apple Silicon
└── OpenClaw SecurityAudit-CN-2026.1.29-x64.dmg    # Intel
```

## 安装包特性

### Windows NSIS 安装包
- ✅ 支持自定义安装目录
- ✅ 创建桌面和开始菜单快捷方式
- ✅ 安装完成后自动启动应用
- ✅ 支持完整卸载
- ✅ 中文/英文界面

### Windows 便携版
- ✅ 无需安装，直接运行
- ✅ 适合 U 盘携带

### macOS DMG
- ✅ 拖拽安装
- ✅ 支持 Apple Silicon (arm64) 和 Intel (x64)
- ✅ 包含应用签名权限 (entitlements)

## 用户使用前提

用户在使用本应用前，需要：

1. **安装 Node.js 22+**
   - Windows: https://nodejs.org/
   - macOS: `brew install node`

2. **全局安装 OpenClaw CLI**
   ```bash
   npm install -g openclaw
   ```

3. **配置 OpenClaw**
   ```bash
   openclaw onboard
   ```

## 故障排除

### Gateway 启动失败
- 检查是否已全局安装 openclaw: `openclaw --version`
- 检查端口 18789 是否被占用:
  - Windows: `netstat -ano | findstr 18789`
  - macOS: `lsof -i :18789`

### 窗口空白
- 检查 Gateway 是否正在运行
- 按 F12 打开开发者工具查看错误

### macOS 签名问题
如果遇到 "应用已损坏" 或 "无法验证开发者" 错误：
```bash
xattr -cr /Applications/OpenClaw\ SecurityAudit-CN.app
```

### electron-builder 下载慢
设置镜像源：
```bash
# Windows PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# macOS/Linux
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
```

## 高级配置

### 代码签名 (macOS)

如需进行代码签名和公证，需要设置以下环境变量：

```bash
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"
export APPLE_ID="your_apple_id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

然后使用：
```bash
npx electron-builder --mac --publish never
```

### 自定义版本号

修改 `apps/desktop/package.json` 中的 `version` 字段。

### 自定义应用图标

1. 准备 1024x1024 PNG 图标
2. Windows: 转换为 ICO 格式，放入 `build/icon.ico`
3. macOS: 转换为 ICNS 格式，放入 `build/icon.icns`

在线转换工具：
- https://cloudconvert.com/png-to-ico
- https://cloudconvert.com/png-to-icns
