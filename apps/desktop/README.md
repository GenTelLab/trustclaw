# OpenClaw Desktop App

跨平台桌面应用程序，基于 Electron（支持 Windows、macOS、Linux）。

## 安装和启动

### 方法 1: 使用 pnpm（推荐）

```powershell
# 在项目根目录
cd D:\01-code\moltbot

# 安装所有依赖（包括 Electron）
pnpm install

# 进入 Windows GUI 目录
cd apps\desktop

# 启动应用
pnpm start

# 或开发模式（带开发者工具）
pnpm dev
```

### 方法 2: 如果 Electron 安装失败

如果遇到 Electron 安装问题，可以尝试：

```powershell
# 1. 清理并重新安装
cd apps\desktop
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
pnpm install --force

# 2. 如果还是失败，尝试使用 npm 安装 Electron
npm install electron@^32.0.0 --save-dev

# 3. 手动下载 Electron（如果网络问题）
# 设置 Electron 镜像源
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install electron@^32.0.0 --save-dev

# 4. 启动
pnpm start
```

### 方法 3: 使用全局 Electron

```powershell
# 全局安装 Electron
npm install -g electron@^32.0.0

# 然后直接运行
cd apps\desktop
electron .
```

## 功能

- **安全配置面板**: 配置安全网关 URL、Token 和安全开关
- **频道管理**: 管理各种聊天频道配置
- **CLI 执行**: 在 GUI 中执行 openclaw 命令
- **日志查看**: 查看系统日志和安全检查事件

## 配置

GUI 会读取和保存配置到 `~/.openclaw/openclaw.json`

## 故障排除

### Electron 安装失败

1. 检查网络连接
2. 尝试使用国内镜像：
   ```powershell
   $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
   pnpm install
   ```

3. 手动下载 Electron 二进制文件：
   - 访问 https://github.com/electron/electron/releases
   - 下载对应版本的 Windows 版本
   - 解压到 `node_modules/electron/dist/` 目录

### 启动时找不到模块

确保在项目根目录运行过 `pnpm build`：

```powershell
cd D:\01-code\moltbot
pnpm build
```
