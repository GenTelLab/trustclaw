[English](README-EN.md) | [中文](README.md)

# TrustClaw Security Audit

<p align="center">
  <img src="apps/desktop/renderer/logo.png" alt="TrustClaw Logo" width="120" />
</p>

<p align="center">
  <strong>AI Security Audit Gateway Console</strong><br>
  One-stop management for AI tool call security detection, model configuration, and skill extensions
</p>

---

## 📦 Download & Install

### Windows Users

1. **Download Installer**
   
   Download the latest version from [Releases](../../releases):
   ```
   TrustClaw-SecurityAudit-Setup-2026.x.xx.exe
   ```

2. **Run Installer**
   
   - Double-click the `.exe` file to start the setup wizard
   - Choose installation directory (default is fine)
   - Click "Install" and wait for completion
   - Check "Run TrustClaw SecurityAudit" and click "Finish"

3. **First Launch**
   
   After installation, the app will automatically start and:
   - Show loading screen
   - Start Gateway service in background
   - Load the console interface

### macOS Users

1. **Download DMG**
   ```
   TrustClaw-SecurityAudit-2026.x.xx-arm64.dmg  # Apple Silicon
   TrustClaw-SecurityAudit-2026.x.xx-x64.dmg    # Intel
   ```

2. **Install Application**
   - Double-click to open DMG file
   - Drag the app to Applications folder
   - On first launch, right-click and select "Open" to bypass Gatekeeper

---

## 🛠️ Run from Source (Developers)

If you want to run from source or contribute to development:

### Requirements

| Dependency | Version | Description |
|------------|---------|-------------|
| Node.js | 22+ | JavaScript runtime |
| pnpm | Latest | Package manager |
| Python | 3.10+ | Skill scripts (optional) |

### Step 1: Clone Repository

```bash
git clone https://github.com/IrvinZheng/trustclaw_security.git
cd trustclaw_security
```

### Step 2: Install Dependencies

```bash
# Install project dependencies
pnpm install

# Enter desktop app directory, install Electron dependencies
cd apps/desktop
npm install
```

### Step 3: Build Project

```bash
# Return to project root
cd ../..

# Build main project (TypeScript compilation)
pnpm build

# Build Control UI (Web interface)
cd ui
pnpm build
cd ..
```

### Step 4: Start Application

```bash
# Enter desktop app directory
cd apps/desktop

# Start Electron app
npm start
```

### Development Mode

For code modifications, use development mode:

```bash
# Terminal 1: Watch main project changes (optional)
pnpm build --watch

# Terminal 2: Watch UI changes
cd ui
pnpm dev

# Terminal 3: Start Electron (dev mode)
cd apps/desktop
npm run dev
```

### Directory Structure

```
trustclaw_security/
├── src/                    # Core source code
│   ├── cli/                # CLI commands
│   ├── gateway/            # Gateway service
│   └── ...
├── ui/                     # Control UI (Web interface)
│   ├── src/
│   └── ...
├── apps/
│   ├── desktop/            # Electron desktop app ← You are here
│   │   ├── main.js         # Electron main process
│   │   ├── preload.js      # Preload script
│   │   ├── renderer/       # Renderer process (Loading page)
│   │   └── package.json    # Electron config
│   ├── android/            # Android app
│   ├── ios/                # iOS app
│   └── macos/              # Native macOS app
├── skills/                 # Skills/tool scripts
│   ├── game-code/          # Game code generator
│   └── ...
├── dist/                   # Build output
│   ├── control-ui/         # UI build artifacts
│   └── ...
└── package.json            # Project config
```

### Build Installer

After building, package as installer:

```bash
cd apps/desktop

# Windows installer
npm run build:win

# macOS installer (must run on macOS)
npm run build:mac

# Or use one-click scripts
# Windows:
.\build.bat

# macOS:
./build-mac.sh
```

Build output is in `apps/desktop/dist/` directory.

### Troubleshooting

#### Q: `pnpm build` fails with WSL/bash unavailable

On Windows without WSL, skip canvas bundling step and run directly:

```powershell
npx tsc -p tsconfig.json
```

#### Q: Electron installation fails

Set mirror source:

```powershell
# Windows PowerShell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install
```

```bash
# macOS/Linux
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install
```

#### Q: "Gateway startup failed" on launch

Ensure main project is built:

```bash
cd /path/to/trustclaw_security
pnpm build
```

---

## ⚙️ Initial Configuration

### Auto-generated Token

On first launch, the system automatically generates a Gateway Token and saves to config:

```
~/.trustclaw/trustclaw.json  (user config)
```

Config example:
```json
{
  "gateway": {
    "auth": {
      "token": "auto-generated-secure-token"
    }
  }
}
```

> 💡 **Tip**: Token protects the Gateway API, no manual configuration needed.

---

## 🎛️ Basic Operations

### 1. Model Configuration

Go to **Config** page to set up AI models:

| Setting | Description | Example |
|---------|-------------|---------|
| `model.default` | Default model | `gpt-4o`, `claude-3-5-sonnet` |
| `model.apiKey` | API key | `sk-xxx...` |
| `model.baseUrl` | Custom API endpoint (optional) | `https://api.openai.com/v1` |

**Supported Model Providers:**
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude)
- DeepSeek
- Zhipu AI (GLM-4)
- Local models (Ollama)

### 2. Security Configuration

Go to **Security** page to configure security policies:

#### Security Gateway Settings

| Setting | Description |
|---------|-------------|
| Security Gateway URL | Third-party security detection API endpoint |
| API Token | Authentication token for security API |

#### Bot Security Switches

| Switch | Function |
|--------|----------|
| 🛡️ Tool Execution Confirmation | Medium/high risk operations require user confirmation |
| 🌐 Network Isolation Mode | Block external network access |
| 📁 File System Restriction | Limit file read/write scope |
| 📝 Audit Logging | Record all tool calls |
| ⏱️ Rate Limiting | Prevent API abuse |

---

## 🎮 Skill Demo: Game Code

**Game Code** is an HTML5 mini-game generator supporting template and AI generation modes.

### Quick Access from Panel

1. Find **Agent → Skills** in the left menu
2. Search `game` in the filter box
3. Find the **game-code** skill card
4. Fill in parameters and click **Execute**

![Skill Panel - Game Code](docs/assets/screenshots/skill-panel-game-code.png)

**Parameters:**

| Parameter | Description | Example |
|-----------|-------------|---------|
| Output Directory | Where to save game files | `D:\games` |
| Generation Mode | Template or AI generation | Template Mode (Quick classic games) |
| Game Type | Select game template | Snake, Tetris, etc. |
| Game Title | Custom game name (optional) | My Game |

**Game Preview:**

![Tetris Game Demo](docs/assets/screenshots/tetris-game-demo.png)

### Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Game Code Skill                       │
├─────────────────────────────────────────────────────────┤
│  📦 Template Mode       │  🤖 AI Generation Mode         │
│  ─────────────────      │  ─────────────────             │
│  • Snake                │  • Natural language prompts    │
│  • Tetris               │  • GPT-4o / Claude generates   │
│  • Breakout             │  • Fully custom game logic     │
│  • Pong                 │                                │
│  • Flappy Bird          │                                │
│  • Memory Match         │                                │
└─────────────────────────────────────────────────────────┘
```

### Usage

#### Method 1: Template Mode (Quick Generation)

```bash
# Generate Snake game
python scripts/game_gen.py --mode template --type snake --output ~/games/snake

# Generate Tetris
python scripts/game_gen.py --mode template --type tetris --output ~/games/tetris --title "My Tetris"
```

**Supported Game Templates:**

| Type | Game | Controls |
|------|------|----------|
| `snake` | 🐍 Snake | Arrow keys |
| `tetris` | 🧱 Tetris | Arrows + Space |
| `breakout` | 🧱 Breakout | Mouse/Touch |
| `pong` | 🏓 Pong | W/S and ↑/↓ |
| `flappy` | 🐦 Flappy Bird | Space/Click |
| `memory` | 🃏 Memory Match | Mouse click |

#### Method 2: AI Generation Mode (Custom Games)

```bash
# Generate space shooter with GPT-4o
python scripts/game_gen.py --mode ai \
  --prompt "Create a space shooter where player dodges asteroids and shoots enemies, with scoring and 3 lives" \
  --output ~/games/space-shooter \
  --model gpt-4o

# Generate 2048 with Claude
python scripts/game_gen.py --mode ai \
  --prompt "Make a 2048 number merge game with smooth sliding animations and touch support" \
  --output ~/games/2048 \
  --model claude-3-5-sonnet
```

**Supported AI Models:**

| Model | Environment Variable | Features |
|-------|---------------------|----------|
| `gpt-4o` | `OPENAI_API_KEY` | High code quality, recommended |
| `gpt-4o-mini` | `OPENAI_API_KEY` | Fast, low cost |
| `claude-3-5-sonnet` | `ANTHROPIC_API_KEY` | Creative |
| `deepseek-chat` | `DEEPSEEK_API_KEY` | Cost-effective |

---

## 📋 Interface Navigation

| Menu | Function |
|------|----------|
| **Chat** | AI conversation interface |
| **Overview** | System overview and status |
| **Channels** | Messaging channel management (Telegram, Discord, etc.) |
| **Instances** | Running instance monitoring |
| **Sessions** | Session management |
| **Cron** | Scheduled task configuration |
| **Security** | Security policy configuration |
| **Skills** | Skills/tools management |
| **Nodes** | Node configuration |
| **Config** | Global configuration |
| **Debug** | Debug tools |
| **Logs** | Log viewer |

---

## 🔧 Troubleshooting

### Gateway Startup Failed

1. Check if port is in use:
   ```powershell
   netstat -ano | findstr 18789
   ```

2. Restart app or manually start Gateway:
   ```bash
   trustclaw gateway run --port 18789 --bind loopback
   ```

### Window Shows Blank

1. Wait for Gateway to fully start (~5-10 seconds)
2. Check network connection
3. Press `F12` to open DevTools and check errors

### Config File Locations

| System | Path |
|--------|------|
| Windows | `C:\Users\<username>\.trustclaw\trustclaw.json` |
| macOS | `~/.trustclaw/trustclaw.json` |
| Linux | `~/.trustclaw/trustclaw.json` |

---

## 📞 Get Help

- 📖 [Full Documentation](https://docs.trustclaw.ai)
- 🐛 [Report Issues](https://github.com/IrvinZheng/trustclaw_security/issues)
- 💬 [Community Discussions](https://github.com/IrvinZheng/trustclaw_security/discussions)

---

<p align="center">
  <sub>Built with ❤️ by TrustClaw Team</sub>
</p>
