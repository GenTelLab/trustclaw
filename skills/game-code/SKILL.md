---
name: game-code
description: 生成HTML5小游戏代码（需要Python 3.10+）。支持两种模式：(1) 预设模板快速生成经典游戏 (2) 调用AI大模型根据需求实时编写自定义游戏代码。
homepage: https://developer.mozilla.org/docs/Games
metadata: {"openclaw":{"emoji":"🎮","requires":{"anyBins":["python3","python","py"]},"install":[{"id":"python-brew","kind":"brew","formula":"python","bins":["python3"],"label":"Install Python (brew)"},{"id":"python-web","kind":"node","package":"n/a","bins":["python"],"label":"Download Python 3.10+ from python.org"}]}}
---

# Game Code (HTML5游戏代码生成器)

使用此技能生成完整的HTML5小游戏代码。支持**模板模式**和**AI生成模式**。

## 模式一：AI大模型生成（推荐）

根据你的需求描述，调用AI大模型实时生成自定义游戏代码。

```bash
python3 {baseDir}/scripts/game_gen.py --mode ai --prompt "你的游戏需求描述" --output <output_dir> [--model <model_name>] [--api-key <key>]
```

### 示例

```bash
# 使用OpenAI生成自定义游戏
python3 {baseDir}/scripts/game_gen.py --mode ai \
  --prompt "创建一个太空射击游戏，玩家控制飞船躲避陨石并射击敌人" \
  --output ~/games/space-shooter \
  --model gpt-4o

# 使用Claude生成游戏
python3 {baseDir}/scripts/game_gen.py --mode ai \
  --prompt "做一个2048数字合并游戏，要有漂亮的动画效果" \
  --output ~/games/2048 \
  --model claude-3-5-sonnet \
  --api-key $ANTHROPIC_API_KEY

# 使用环境变量中的API Key
export OPENAI_API_KEY="your-key"
python3 {baseDir}/scripts/game_gen.py --mode ai \
  --prompt "创建一个跑酷游戏，角色需要跳跃躲避障碍物" \
  --output ~/games/runner
```

### 支持的AI模型

| 模型 | 环境变量 | 说明 |
|------|----------|------|
| `gpt-4o` (默认) | `OPENAI_API_KEY` | OpenAI GPT-4o |
| `gpt-4o-mini` | `OPENAI_API_KEY` | OpenAI GPT-4o Mini |
| `claude-3-5-sonnet` | `ANTHROPIC_API_KEY` | Anthropic Claude |
| `deepseek-chat` | `DEEPSEEK_API_KEY` | DeepSeek |

## 模式二：模板生成（快速）

使用预设模板快速生成经典游戏。

```bash
python3 {baseDir}/scripts/game_gen.py --mode template --type <game_type> --output <output_dir> [--title <game_title>]
```

### 支持的游戏模板

| 类型 | 说明 |
|------|------|
| `snake` | 经典贪吃蛇游戏 |
| `tetris` | 俄罗斯方块 |
| `breakout` | 打砖块 |
| `pong` | 乒乓球 |
| `flappy` | 跳跃小鸟 |
| `memory` | 记忆翻牌 |

### 示例

```bash
# 生成贪吃蛇游戏
python3 {baseDir}/scripts/game_gen.py --mode template --type snake --output ~/games/snake --title "我的贪吃蛇"

# 生成俄罗斯方块
python3 {baseDir}/scripts/game_gen.py --mode template --type tetris --output ~/games/tetris
```

## 输出内容

每个游戏输出到指定目录，包含:

- `index.html` - 完整的游戏页面
- `game.js` - 游戏逻辑代码  
- `style.css` - 游戏样式

## 注意事项

- 输出目录必须是空目录或不存在（脚本会自动创建）
- AI模式需要配置对应的API Key（环境变量或--api-key参数）
- 生成完成后，直接用浏览器打开 `index.html` 即可游玩
- 所有游戏都支持键盘控制，部分支持触屏
