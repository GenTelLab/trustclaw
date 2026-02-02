# OpenClaw SecurityAudit-CN 使用指南

<p align="center">
  <img src="renderer/logo.png" alt="OpenClaw Logo" width="120" />
</p>

<p align="center">
  <strong>AI 安全审计网关控制台</strong><br>
  一站式管理 AI 工具调用的安全检测、模型配置和技能扩展
</p>

---

## 📦 下载安装

### Windows 用户

1. **下载安装包**
   
   从 [Releases](../../releases) 页面下载最新版本：
   ```
   OpenClaw SecurityAudit-CN-Setup-2026.x.xx.exe
   ```

2. **运行安装程序**
   
   - 双击 `.exe` 文件启动安装向导
   - 选择安装目录（默认即可）
   - 点击「安装」等待完成
   - 勾选「运行 OpenClaw SecurityAudit-CN」后点击「完成」

3. **首次启动**
   
   安装完成后，应用会自动启动并：
   - 显示 Loading 界面
   - 后台启动 Gateway 服务
   - 加载控制台界面

### macOS 用户

1. **下载 DMG**
   ```
   OpenClaw SecurityAudit-CN-2026.x.xx-arm64.dmg  # Apple Silicon
   OpenClaw SecurityAudit-CN-2026.x.xx-x64.dmg    # Intel
   ```

2. **安装应用**
   - 双击打开 DMG 文件
   - 将应用拖拽到 Applications 文件夹
   - 首次打开时，右键选择「打开」以绕过 Gatekeeper

---

## ⚙️ 首次配置

### Token 自动生成

首次启动时，系统会自动生成 Gateway Token 并保存到配置文件：

```
~/.openclaw/openclaw.json  (用户配置)
```

配置文件示例：
```json
{
  "gateway": {
    "auth": {
      "token": "auto-generated-secure-token"
    }
  }
}
```

> 💡 **提示**：Token 用于保护 Gateway API，无需手动配置。

---

## 🎛️ 基本操作

### 1. 模型配置

进入 **配置 (Config)** 页面，设置 AI 模型：

| 配置项 | 说明 | 示例 |
|-------|------|------|
| `model.default` | 默认模型 | `gpt-4o`, `claude-3-5-sonnet` |
| `model.apiKey` | API 密钥 | `sk-xxx...` |
| `model.baseUrl` | 自定义接口地址（可选） | `https://api.openai.com/v1` |

**支持的模型提供商：**
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude)
- DeepSeek
- 智谱 AI (GLM-4)
- 本地模型 (Ollama)

### 2. 安全配置

进入 **安全 (Security)** 页面，配置安全策略：

#### 安全网关设置

| 配置项 | 说明 |
|-------|------|
| 安全网关接口 | 第三方安全检测 API 地址 |
| API Token | 安全接口的认证令牌 |

#### Bot 安全开关

| 开关 | 功能 |
|------|------|
| 🛡️ 工具执行确认 | 中高风险操作需要用户确认 |
| 🌐 网络隔离模式 | 禁止访问外部网络 |
| 📁 文件系统限制 | 限制文件读写范围 |
| 📝 审计日志 | 记录所有工具调用 |
| ⏱️ 速率限制 | 防止 API 滥用 |

---

## 🎮 Skill 功能演示：Game Code

**Game Code** 是一个 HTML5 小游戏生成器，支持模板生成和 AI 智能生成两种模式。

### 功能概述

```
┌─────────────────────────────────────────────────────────┐
│                    Game Code Skill                      │
├─────────────────────────────────────────────────────────┤
│  📦 模板模式          │  🤖 AI 生成模式                  │
│  ─────────────────    │  ─────────────────               │
│  • 贪吃蛇 (snake)     │  • 自然语言描述需求              │
│  • 俄罗斯方块 (tetris)│  • GPT-4o / Claude 生成代码      │
│  • 打砖块 (breakout)  │  • 完全自定义游戏逻辑            │
│  • 乒乓球 (pong)      │                                  │
│  • 跳跃小鸟 (flappy)  │                                  │
│  • 记忆翻牌 (memory)  │                                  │
└─────────────────────────────────────────────────────────┘
```

### 使用方式

#### 方式一：模板模式（快速生成）

```bash
# 生成贪吃蛇游戏
python scripts/game_gen.py --mode template --type snake --output ~/games/snake

# 生成俄罗斯方块
python scripts/game_gen.py --mode template --type tetris --output ~/games/tetris --title "我的俄罗斯方块"
```

**支持的游戏模板：**

| 类型 | 游戏 | 控制方式 |
|------|------|---------|
| `snake` | 🐍 贪吃蛇 | 方向键 |
| `tetris` | 🧱 俄罗斯方块 | 方向键 + 空格 |
| `breakout` | 🧱 打砖块 | 鼠标/触屏 |
| `pong` | 🏓 乒乓球 | W/S 和 ↑/↓ |
| `flappy` | 🐦 跳跃小鸟 | 空格/点击 |
| `memory` | 🃏 记忆翻牌 | 鼠标点击 |

#### 方式二：AI 生成模式（自定义游戏）

```bash
# 使用 GPT-4o 生成太空射击游戏
python scripts/game_gen.py --mode ai \
  --prompt "创建一个太空射击游戏，玩家控制飞船躲避陨石并射击敌人，有计分系统和3条生命" \
  --output ~/games/space-shooter \
  --model gpt-4o

# 使用 Claude 生成 2048 游戏
python scripts/game_gen.py --mode ai \
  --prompt "做一个2048数字合并游戏，要有漂亮的滑动动画效果，支持触屏操作" \
  --output ~/games/2048 \
  --model claude-3-5-sonnet
```

**支持的 AI 模型：**

| 模型 | 环境变量 | 特点 |
|------|----------|------|
| `gpt-4o` | `OPENAI_API_KEY` | 代码质量高，推荐 |
| `gpt-4o-mini` | `OPENAI_API_KEY` | 速度快，成本低 |
| `claude-3-5-sonnet` | `ANTHROPIC_API_KEY` | 创意性强 |
| `deepseek-chat` | `DEEPSEEK_API_KEY` | 性价比高 |

### 输出结构

每个游戏生成后，目录结构如下：

```
~/games/snake/
├── index.html   # 游戏主页面（双击打开即可游玩）
├── game.js      # 游戏逻辑代码
└── style.css    # 游戏样式
```

### 演示：生成并运行贪吃蛇游戏

```bash
# 1. 生成游戏
python scripts/game_gen.py --mode template --type snake --output ./my-snake-game

# 2. 打开游戏（Windows）
start ./my-snake-game/index.html

# 2. 打开游戏（macOS）
open ./my-snake-game/index.html
```

**游戏截图：**

```
┌──────────────────────────────────────┐
│           🐍 贪吃蛇                   │
│                                      │
│     ┌─────────────────────────┐      │
│     │  ████                   │      │
│     │  █                      │      │
│     │  █        ◆             │      │
│     │  ███████                │      │
│     │                         │      │
│     └─────────────────────────┘      │
│                                      │
│     分数: 40    最高分: 120           │
│     使用方向键控制蛇的移动            │
└──────────────────────────────────────┘
```

---

## 📋 界面导航

| 菜单 | 功能 |
|------|------|
| **Chat** | AI 对话界面 |
| **Overview** | 系统概览和状态 |
| **Channels** | 消息渠道管理 (Telegram, Discord 等) |
| **Instances** | 运行实例监控 |
| **Sessions** | 会话管理 |
| **Cron** | 定时任务配置 |
| **Security** | 安全策略配置 |
| **Skills** | 技能/工具管理 |
| **Nodes** | 节点配置 |
| **Config** | 全局配置 |
| **Debug** | 调试工具 |
| **Logs** | 日志查看 |

---

## 🌐 语言切换

点击右上角的语言按钮可切换中英文：

- 🇨🇳 **中文** - 默认语言
- 🇺🇸 **EN** - English

---

## 🔧 故障排除

### Gateway 启动失败

1. 检查端口是否被占用：
   ```powershell
   netstat -ano | findstr 18789
   ```

2. 重启应用或手动启动 Gateway：
   ```bash
   openclaw gateway run --port 18789 --bind loopback
   ```

### 窗口显示空白

1. 等待 Gateway 完全启动（约 5-10 秒）
2. 检查网络连接
3. 按 `F12` 打开开发者工具查看错误

### 配置文件位置

| 系统 | 路径 |
|------|------|
| Windows | `C:\Users\<用户名>\.openclaw\openclaw.json` |
| macOS | `~/.openclaw/openclaw.json` |
| Linux | `~/.openclaw/openclaw.json` |

---

## 📞 获取帮助

- 📖 [完整文档](https://docs.openclaw.ai)
- 🐛 [报告问题](https://github.com/openclaw/openclaw/issues)
- 💬 [社区讨论](https://github.com/openclaw/openclaw/discussions)

---

<p align="center">
  <sub>Built with ❤️ by OpenClaw Team</sub>
</p>
