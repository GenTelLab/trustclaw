# TrustClaw Desktop App

<p align="center">
  <img src="renderer/logo.png" alt="TrustClaw Logo" width="120" />
</p>

<p align="center">
  <strong>AI Security Audit Gateway Console</strong><br>
  Cross-platform desktop application based on Electron (Windows, macOS, Linux)
</p>

---

## Installation

### Download Pre-built Packages

Download from [Releases](../../releases):

| Platform | File |
|----------|------|
| Windows | `TrustClaw-Setup-2026.x.xx.exe` |
| macOS (Apple Silicon) | `TrustClaw-2026.x.xx-arm64.dmg` |
| macOS (Intel) | `TrustClaw-2026.x.xx-x64.dmg` |

### Windows Installation

1. **Run as Administrator** - Right-click the `.exe` file and select "Run as administrator"
2. Choose installation directory (default is recommended)
3. Click "Install" and wait for completion
4. Check "Run TrustClaw" and click "Finish"

> ⚠️ **Important**: Use English-only paths (e.g., `C:\Program Files\TrustClaw`) to avoid module loading issues.

### macOS Installation

1. Double-click the DMG file
2. Drag the app to Applications folder
3. First launch: Right-click and select "Open" to bypass Gatekeeper

---

## Development Setup

### Using pnpm (Recommended)

```bash
# From project root
pnpm install

# Enter desktop app directory
cd apps/desktop

# Start app
pnpm start

# Or development mode (with DevTools)
pnpm dev
```

### Troubleshooting Electron Installation

```bash
# 1. Clean and reinstall
cd apps/desktop
rm -rf node_modules
pnpm install --force

# 2. Use mirror for China
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" pnpm install

# 3. Or install globally
npm install -g electron@^32.0.0
electron .
```

---

## Features

- **Security Configuration** - Configure security gateway URL, Token and security switches
- **Channel Management** - Manage chat channel configurations (Telegram, Discord, etc.)
- **CLI Execution** - Execute openclaw commands in GUI
- **Log Viewer** - View system logs and security check events
- **Skills Management** - Manage AI tool skills and extensions

## Configuration

Configuration is stored at `~/.openclaw/openclaw.json`

---

## Build from Source

```bash
# Build core first (from project root)
pnpm build

# Build desktop app
cd apps/desktop
pnpm build        # Windows NSIS installer
pnpm build:mac    # macOS DMG
```

---

## Links

- 📖 [Documentation](https://docs.openclaw.ai)
- 🐛 [Report Issues](https://github.com/openclaw/openclaw/issues)
- 💬 [Discussions](https://github.com/openclaw/openclaw/discussions)
