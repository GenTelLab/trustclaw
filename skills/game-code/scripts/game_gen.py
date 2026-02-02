#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "openai>=1.0.0",
#     "anthropic>=0.18.0",
#     "httpx>=0.25.0",
# ]
# ///
"""
Game Code Generator - HTML5游戏代码生成器

支持两种模式:
1. AI模式: 调用AI大模型根据需求描述生成自定义游戏代码
2. 模板模式: 使用预设模板快速生成经典游戏

Usage:
    # AI模式
    python game_gen.py --mode ai --prompt "创建一个太空射击游戏" --output ./game
    
    # 模板模式
    python game_gen.py --mode template --type snake --output ./game
"""

import argparse
import os
import sys
import json
from pathlib import Path
from typing import Optional

# ============ 依赖检查 ============

def check_ai_dependencies():
    """检查 AI 模式所需的依赖"""
    missing = []
    try:
        import openai
    except ImportError:
        missing.append("openai")
    
    if missing:
        print()
        print("=" * 60)
        print("⚠️  缺少必要的依赖包")
        print("=" * 60)
        print()
        print(f"   缺少: {', '.join(missing)}")
        print()
        print("📦 请运行以下命令安装:")
        print()
        print(f"   pip install {' '.join(missing)}")
        print()
        print("   或者 (Windows):")
        print()
        print(f"   py -m pip install {' '.join(missing)}")
        print()
        print("💡 提示: 也可以使用 uv 自动管理依赖:")
        print()
        print(f"   uv run {Path(sys.argv[0]).name} ...")
        print()
        print("=" * 60)
        print()
        sys.exit(1)

# ============ AI Provider Clients ============

def call_openai(prompt: str, model: str, api_key: str) -> str:
    """调用OpenAI API生成游戏代码"""
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)
    
    system_prompt = """你是一个专业的HTML5游戏开发者。用户会给你游戏需求，你需要生成完整可运行的游戏代码。

输出格式要求：
1. 必须输出三个代码块，分别是 index.html, style.css, game.js
2. 使用 ```html, ```css, ```javascript 标记代码块
3. index.html 必须引用 style.css 和 game.js
4. 游戏必须是完整可运行的，打开index.html即可游玩
5. 使用现代CSS和原生JavaScript，不要使用任何外部库
6. 添加适当的响应式设计，支持移动端
7. 包含游戏说明和控制方式提示"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请创建以下游戏：\n{prompt}"}
        ],
        temperature=0.7,
        max_tokens=8000,
    )
    
    return response.choices[0].message.content


def call_anthropic(prompt: str, model: str, api_key: str) -> str:
    """调用Anthropic Claude API生成游戏代码"""
    from anthropic import Anthropic
    
    client = Anthropic(api_key=api_key)
    
    system_prompt = """你是一个专业的HTML5游戏开发者。用户会给你游戏需求，你需要生成完整可运行的游戏代码。

输出格式要求：
1. 必须输出三个代码块，分别是 index.html, style.css, game.js
2. 使用 ```html, ```css, ```javascript 标记代码块
3. index.html 必须引用 style.css 和 game.js
4. 游戏必须是完整可运行的，打开index.html即可游玩
5. 使用现代CSS和原生JavaScript，不要使用任何外部库
6. 添加适当的响应式设计，支持移动端
7. 包含游戏说明和控制方式提示"""

    response = client.messages.create(
        model=model,
        max_tokens=8000,
        system=system_prompt,
        messages=[
            {"role": "user", "content": f"请创建以下游戏：\n{prompt}"}
        ]
    )
    
    return response.content[0].text


def call_deepseek(prompt: str, model: str, api_key: str) -> str:
    """调用DeepSeek API生成游戏代码"""
    from openai import OpenAI
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com/v1"
    )
    
    system_prompt = """你是一个专业的HTML5游戏开发者。用户会给你游戏需求，你需要生成完整可运行的游戏代码。

输出格式要求：
1. 必须输出三个代码块，分别是 index.html, style.css, game.js
2. 使用 ```html, ```css, ```javascript 标记代码块
3. index.html 必须引用 style.css 和 game.js
4. 游戏必须是完整可运行的，打开index.html即可游玩
5. 使用现代CSS和原生JavaScript，不要使用任何外部库
6. 添加适当的响应式设计，支持移动端
7. 包含游戏说明和控制方式提示"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请创建以下游戏：\n{prompt}"}
        ],
        temperature=0.7,
        max_tokens=8000,
    )
    
    return response.choices[0].message.content


def call_zhipu(prompt: str, model: str, api_key: str) -> str:
    """调用智谱AI GLM-4 API生成游戏代码"""
    from openai import OpenAI
    
    client = OpenAI(
        api_key=api_key,
        base_url="https://open.bigmodel.cn/api/paas/v4/"
    )
    
    system_prompt = """你是一个专业的HTML5游戏开发者。用户会给你游戏需求，你需要生成完整可运行的游戏代码。

输出格式要求：
1. 必须输出三个代码块，分别是 index.html, style.css, game.js
2. 使用 ```html, ```css, ```javascript 标记代码块
3. index.html 必须引用 style.css 和 game.js
4. 游戏必须是完整可运行的，打开index.html即可游玩
5. 使用现代CSS和原生JavaScript，不要使用任何外部库
6. 添加适当的响应式设计，支持移动端
7. 包含游戏说明和控制方式提示"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"请创建以下游戏：\n{prompt}"}
        ],
        temperature=0.7,
        max_tokens=8000,
    )
    
    return response.choices[0].message.content


def parse_ai_response(response: str) -> dict:
    """解析AI响应，提取HTML、CSS、JS代码"""
    import re
    
    result = {
        "html": "",
        "css": "",
        "js": ""
    }
    
    # 匹配 ```html ... ``` 代码块
    html_match = re.search(r'```html\s*([\s\S]*?)```', response, re.IGNORECASE)
    if html_match:
        result["html"] = html_match.group(1).strip()
    
    # 匹配 ```css ... ``` 代码块
    css_match = re.search(r'```css\s*([\s\S]*?)```', response, re.IGNORECASE)
    if css_match:
        result["css"] = css_match.group(1).strip()
    
    # 匹配 ```javascript 或 ```js 代码块
    js_match = re.search(r'```(?:javascript|js)\s*([\s\S]*?)```', response, re.IGNORECASE)
    if js_match:
        result["js"] = js_match.group(1).strip()
    
    return result


def generate_with_ai(prompt: str, output_dir: Path, model: str, api_key: Optional[str] = None):
    """使用AI生成游戏代码"""
    
    # 检查依赖
    check_ai_dependencies()
    
    # 确定使用哪个provider和API key
    model_lower = model.lower()
    
    if "claude" in model_lower:
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            print("错误: 使用Claude需要设置 ANTHROPIC_API_KEY 环境变量或 --api-key 参数")
            sys.exit(1)
        print(f"正在调用 Claude ({model}) 生成游戏代码...")
        response = call_anthropic(prompt, model, key)
        
    elif "deepseek" in model_lower:
        key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        if not key:
            print("错误: 使用DeepSeek需要设置 DEEPSEEK_API_KEY 环境变量或 --api-key 参数")
            sys.exit(1)
        print(f"正在调用 DeepSeek ({model}) 生成游戏代码...")
        response = call_deepseek(prompt, model, key)
        
    elif "glm" in model_lower:
        key = api_key or os.environ.get("ZHIPU_API_KEY") or os.environ.get("GLM_API_KEY")
        if not key:
            print("错误: 使用GLM需要设置 ZHIPU_API_KEY 或 GLM_API_KEY 环境变量或 --api-key 参数")
            sys.exit(1)
        print(f"正在调用 智谱AI ({model}) 生成游戏代码...")
        response = call_zhipu(prompt, model, key)
        
    else:  # 默认使用OpenAI
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            print("错误: 使用OpenAI需要设置 OPENAI_API_KEY 环境变量或 --api-key 参数")
            sys.exit(1)
        print(f"正在调用 OpenAI ({model}) 生成游戏代码...")
        response = call_openai(prompt, model, key)
    
    # 解析响应
    print("正在解析生成的代码...")
    codes = parse_ai_response(response)
    
    if not codes["html"]:
        print("警告: 未能解析出HTML代码，将保存原始响应")
        # 保存原始响应以便调试
        (output_dir / "ai_response.txt").write_text(response, encoding="utf-8")
        print(f"原始响应已保存到: {output_dir / 'ai_response.txt'}")
        return
    
    # 写入文件
    output_dir.mkdir(parents=True, exist_ok=True)
    
    (output_dir / "index.html").write_text(codes["html"], encoding="utf-8")
    print(f"✓ 已生成: {output_dir / 'index.html'}")
    
    if codes["css"]:
        (output_dir / "style.css").write_text(codes["css"], encoding="utf-8")
        print(f"✓ 已生成: {output_dir / 'style.css'}")
    
    if codes["js"]:
        (output_dir / "game.js").write_text(codes["js"], encoding="utf-8")
        print(f"✓ 已生成: {output_dir / 'game.js'}")
    
    print(f"\n🎮 游戏生成完成！用浏览器打开以下文件即可游玩:")
    print(f"   {output_dir / 'index.html'}")


# ============ Template Games ============

GAME_TEMPLATES = {
    "snake": {
        "title": "贪吃蛇",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="score">得分: <span id="score">0</span></div>
        <canvas id="gameCanvas" width="400" height="400"></canvas>
        <div class="controls">
            <p>使用方向键 ↑↓←→ 或 WASD 控制蛇的移动</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

h1 {
    color: #4ecca3;
    margin-bottom: 1rem;
    font-size: 2rem;
}

.score {
    color: #fff;
    font-size: 1.2rem;
    margin-bottom: 1rem;
}

#gameCanvas {
    background: #0f0f23;
    border: 3px solid #4ecca3;
    border-radius: 10px;
    display: block;
    margin: 0 auto;
}

.controls {
    margin-top: 1rem;
}

.controls p {
    color: #aaa;
    margin-bottom: 1rem;
}

#startBtn {
    padding: 12px 30px;
    font-size: 1rem;
    background: #4ecca3;
    color: #1a1a2e;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.2s, background 0.2s;
}

#startBtn:hover {
    background: #3db892;
    transform: scale(1.05);
}''',
        "js": '''const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 15};
let dx = 0;
let dy = 0;
let score = 0;
let gameLoop = null;
let gameRunning = false;

function drawGame() {
    // 清空画布
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    ctx.strokeStyle = '#1a1a3e';
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // 绘制食物
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        const gradient = ctx.createRadialGradient(
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            0,
            segment.x * gridSize + gridSize/2,
            segment.y * gridSize + gridSize/2,
            gridSize/2
        );
        gradient.addColorStop(0, index === 0 ? '#4ecca3' : '#3db892');
        gradient.addColorStop(1, index === 0 ? '#3db892' : '#2d8a6e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
}

function moveSnake() {
    if (dx === 0 && dy === 0) return;
    
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    // 检查碰撞
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }
}

function placeFood() {
    do {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width/2, canvas.height/2 + 20);
    startBtn.textContent = '重新开始';
}

function startGame() {
    snake = [{x: 10, y: 10}];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    placeFood();
    gameRunning = true;
    startBtn.textContent = '游戏中...';
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        moveSnake();
        drawGame();
    }, 100);
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown': case 's': case 'S':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft': case 'a': case 'A':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight': case 'd': case 'D':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

startBtn.addEventListener('click', startGame);
drawGame();'''
    },
    
    "tetris": {
        "title": "俄罗斯方块",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="game-info">
            <div class="score">得分: <span id="score">0</span></div>
            <div class="level">等级: <span id="level">1</span></div>
        </div>
        <canvas id="gameCanvas" width="300" height="600"></canvas>
        <div class="controls">
            <p>← → 移动 | ↑ 旋转 | ↓ 加速 | Space 直落</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

h1 {
    color: #00d4ff;
    margin-bottom: 1rem;
    font-size: 2rem;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.game-info {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1rem;
}

.score, .level {
    color: #fff;
    font-size: 1.1rem;
}

#gameCanvas {
    background: #0a0a15;
    border: 3px solid #00d4ff;
    border-radius: 5px;
    display: block;
    margin: 0 auto;
}

.controls {
    margin-top: 1rem;
}

.controls p {
    color: #888;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

#startBtn {
    padding: 12px 30px;
    font-size: 1rem;
    background: linear-gradient(135deg, #00d4ff, #0099cc);
    color: #fff;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

#startBtn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}''',
        "js": '''const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const COLORS = ['#00d4ff', '#ff6b9d', '#c44fff', '#ffcc00', '#00ff88', '#ff8844', '#ff4444'];

const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
];

let board = [];
let currentPiece = null;
let currentX = 0;
let currentY = 0;
let currentColor = 0;
let score = 0;
let level = 1;
let gameLoop = null;
let gameRunning = false;

function createBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            board[r][c] = 0;
        }
    }
}

function drawBlock(x, y, color) {
    ctx.fillStyle = COLORS[color - 1] || '#333';
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    if (color > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, 3);
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 3, BLOCK_SIZE - 1);
    }
}

function drawBoard() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                drawBlock(c, r, board[r][c]);
            }
        }
    }
}

function drawPiece() {
    if (!currentPiece) return;
    for (let r = 0; r < currentPiece.length; r++) {
        for (let c = 0; c < currentPiece[r].length; c++) {
            if (currentPiece[r][c]) {
                drawBlock(currentX + c, currentY + r, currentColor);
            }
        }
    }
}

function newPiece() {
    const idx = Math.floor(Math.random() * SHAPES.length);
    currentPiece = SHAPES[idx].map(row => [...row]);
    currentColor = idx + 1;
    currentX = Math.floor((COLS - currentPiece[0].length) / 2);
    currentY = 0;
    
    if (collision(0, 0)) {
        gameOver();
    }
}

function collision(offsetX, offsetY, piece = currentPiece) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
            if (piece[r][c]) {
                const newX = currentX + c + offsetX;
                const newY = currentY + r + offsetY;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

function merge() {
    for (let r = 0; r < currentPiece.length; r++) {
        for (let c = 0; c < currentPiece[r].length; c++) {
            if (currentPiece[r][c]) {
                board[currentY + r][currentX + c] = currentColor;
            }
        }
    }
}

function rotate() {
    const rotated = currentPiece[0].map((_, i) => 
        currentPiece.map(row => row[i]).reverse()
    );
    if (!collision(0, 0, rotated)) {
        currentPiece = rotated;
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            r++;
        }
    }
    if (linesCleared > 0) {
        score += [0, 100, 300, 500, 800][linesCleared] * level;
        scoreElement.textContent = score;
        level = Math.floor(score / 1000) + 1;
        levelElement.textContent = level;
    }
}

function drop() {
    if (!collision(0, 1)) {
        currentY++;
    } else {
        merge();
        clearLines();
        newPiece();
    }
}

function hardDrop() {
    while (!collision(0, 1)) {
        currentY++;
    }
    merge();
    clearLines();
    newPiece();
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width/2, canvas.height/2 + 20);
    startBtn.textContent = '重新开始';
}

function gameStep() {
    drop();
    drawBoard();
    drawPiece();
}

function startGame() {
    createBoard();
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    newPiece();
    gameRunning = true;
    startBtn.textContent = '游戏中...';
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, Math.max(100, 500 - level * 50));
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (!collision(-1, 0)) currentX--;
            break;
        case 'ArrowRight':
            if (!collision(1, 0)) currentX++;
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ':
            hardDrop();
            break;
    }
    drawBoard();
    drawPiece();
});

startBtn.addEventListener('click', startGame);
createBoard();
drawBoard();'''
    },
    
    "breakout": {
        "title": "打砖块",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="game-info">
            <div class="score">得分: <span id="score">0</span></div>
            <div class="lives">生命: <span id="lives">3</span></div>
        </div>
        <canvas id="gameCanvas" width="480" height="400"></canvas>
        <div class="controls">
            <p>使用鼠标或 ← → 键移动挡板</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #1e0533 0%, #3d1a5c 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

h1 {
    color: #ff6b9d;
    margin-bottom: 1rem;
    font-size: 2rem;
    text-shadow: 0 0 20px rgba(255, 107, 157, 0.5);
}

.game-info {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1rem;
}

.score, .lives {
    color: #fff;
    font-size: 1.1rem;
}

#gameCanvas {
    background: #0a0a15;
    border: 3px solid #ff6b9d;
    border-radius: 5px;
    display: block;
    margin: 0 auto;
    cursor: none;
}

.controls {
    margin-top: 1rem;
}

.controls p {
    color: #888;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

#startBtn {
    padding: 12px 30px;
    font-size: 1rem;
    background: linear-gradient(135deg, #ff6b9d, #c44fff);
    color: #fff;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

#startBtn:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 107, 157, 0.5);
}''',
        "js": '''const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');

const paddleWidth = 80;
const paddleHeight = 12;
const ballRadius = 8;
const brickRows = 5;
const brickCols = 8;
const brickWidth = 54;
const brickHeight = 20;
const brickPadding = 5;
const brickOffsetTop = 40;
const brickOffsetLeft = 8;

const COLORS = ['#ff6b9d', '#c44fff', '#00d4ff', '#00ff88', '#ffcc00'];

let paddleX;
let ballX, ballY, ballDX, ballDY;
let bricks = [];
let score = 0;
let lives = 3;
let gameLoop = null;
let gameRunning = false;

function createBricks() {
    bricks = [];
    for (let r = 0; r < brickRows; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickCols; c++) {
            bricks[r][c] = { x: 0, y: 0, status: 1, color: COLORS[r] };
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(paddleX, canvas.height - paddleHeight, paddleX + paddleWidth, canvas.height);
    gradient.addColorStop(0, '#ff6b9d');
    gradient.addColorStop(1, '#c44fff');
    ctx.fillStyle = gradient;
    ctx.roundRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight, 5);
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {
            if (bricks[r][c].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[r][c].x = brickX;
                bricks[r][c].y = brickY;
                ctx.beginPath();
                ctx.fillStyle = bricks[r][c].color;
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 3);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function collisionDetection() {
    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {
            const brick = bricks[r][c];
            if (brick.status === 1) {
                if (ballX > brick.x && ballX < brick.x + brickWidth &&
                    ballY > brick.y && ballY < brick.y + brickHeight) {
                    ballDY = -ballDY;
                    brick.status = 0;
                    score += 10;
                    scoreElement.textContent = score;
                    
                    if (score === brickRows * brickCols * 10) {
                        gameWin();
                    }
                }
            }
        }
    }
}

function draw() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    
    // 边界碰撞
    if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
        ballDX = -ballDX;
    }
    if (ballY + ballDY < ballRadius) {
        ballDY = -ballDY;
    } else if (ballY + ballDY > canvas.height - ballRadius - paddleHeight - 10) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            const hitPoint = (ballX - paddleX) / paddleWidth;
            ballDX = 6 * (hitPoint - 0.5);
            ballDY = -Math.abs(ballDY);
        } else if (ballY + ballDY > canvas.height - ballRadius) {
            lives--;
            livesElement.textContent = lives;
            if (lives === 0) {
                gameOver();
                return;
            }
            resetBall();
        }
    }
    
    ballX += ballDX;
    ballY += ballDY;
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height - 60;
    ballDX = 3;
    ballDY = -4;
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b9d';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width/2, canvas.height/2 + 20);
    startBtn.textContent = '重新开始';
}

function gameWin() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff88';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('恭喜通关!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width/2, canvas.height/2 + 20);
    startBtn.textContent = '再玩一次';
}

function startGame() {
    createBricks();
    paddleX = (canvas.width - paddleWidth) / 2;
    resetBall();
    score = 0;
    lives = 3;
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    gameRunning = true;
    startBtn.textContent = '游戏中...';
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, 16);
}

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, mouseX - paddleWidth / 2));
});

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowLeft') {
        paddleX = Math.max(0, paddleX - 20);
    } else if (e.key === 'ArrowRight') {
        paddleX = Math.min(canvas.width - paddleWidth, paddleX + 20);
    }
});

startBtn.addEventListener('click', startGame);
createBricks();
draw();'''
    },
    
    "pong": {
        "title": "乒乓球",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="game-info">
            <div class="player-score">玩家: <span id="playerScore">0</span></div>
            <div class="ai-score">电脑: <span id="aiScore">0</span></div>
        </div>
        <canvas id="gameCanvas" width="600" height="400"></canvas>
        <div class="controls">
            <p>使用 ↑↓ 或 W/S 键控制左侧挡板</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 20px;
}
h1 { color: #00ff88; margin-bottom: 1rem; font-size: 2rem; }
.game-info { display: flex; justify-content: center; gap: 3rem; margin-bottom: 1rem; }
.player-score, .ai-score { color: #fff; font-size: 1.3rem; }
#gameCanvas { background: #0a0a15; border: 3px solid #00ff88; border-radius: 5px; }
.controls { margin-top: 1rem; }
.controls p { color: #888; margin-bottom: 1rem; }
#startBtn {
    padding: 12px 30px; font-size: 1rem;
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    color: #0d1b2a; border: none; border-radius: 25px; cursor: pointer;
}
#startBtn:hover { transform: scale(1.05); }''',
        "js": '''const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const startBtn = document.getElementById('startBtn');

const paddleWidth = 10, paddleHeight = 80, ballSize = 10;
let playerY, aiY, ballX, ballY, ballDX, ballDY;
let playerScore = 0, aiScore = 0;
let gameLoop = null, gameRunning = false;

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballDX = (Math.random() > 0.5 ? 1 : -1) * 5;
    ballDY = (Math.random() - 0.5) * 6;
}

function draw() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 中线
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 挡板
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(20, playerY, paddleWidth, paddleHeight);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(canvas.width - 30, aiY, paddleWidth, paddleHeight);
    
    // 球
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
    ctx.fill();
    
    // AI移动
    const aiCenter = aiY + paddleHeight / 2;
    if (aiCenter < ballY - 20) aiY += 4;
    else if (aiCenter > ballY + 20) aiY -= 4;
    
    // 球移动
    ballX += ballDX;
    ballY += ballDY;
    
    // 上下边界
    if (ballY < ballSize || ballY > canvas.height - ballSize) ballDY = -ballDY;
    
    // 挡板碰撞
    if (ballX < 30 + ballSize && ballY > playerY && ballY < playerY + paddleHeight) {
        ballDX = Math.abs(ballDX) * 1.05;
        ballDY += (ballY - playerY - paddleHeight/2) * 0.1;
    }
    if (ballX > canvas.width - 40 && ballY > aiY && ballY < aiY + paddleHeight) {
        ballDX = -Math.abs(ballDX) * 1.05;
    }
    
    // 得分
    if (ballX < 0) { aiScore++; aiScoreEl.textContent = aiScore; resetBall(); }
    if (ballX > canvas.width) { playerScore++; playerScoreEl.textContent = playerScore; resetBall(); }
    
    if (playerScore >= 5 || aiScore >= 5) gameOver();
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = playerScore >= 5 ? '#00ff88' : '#ff6b9d';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore >= 5 ? '你赢了!' : '电脑赢了!', canvas.width/2, canvas.height/2);
    startBtn.textContent = '重新开始';
}

function startGame() {
    playerY = aiY = (canvas.height - paddleHeight) / 2;
    playerScore = aiScore = 0;
    playerScoreEl.textContent = aiScoreEl.textContent = 0;
    resetBall();
    gameRunning = true;
    startBtn.textContent = '游戏中...';
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, 16);
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if ((e.key === 'ArrowUp' || e.key === 'w') && playerY > 0) playerY -= 20;
    if ((e.key === 'ArrowDown' || e.key === 's') && playerY < canvas.height - paddleHeight) playerY += 20;
});

startBtn.addEventListener('click', startGame);
draw();'''
    },
    
    "flappy": {
        "title": "跳跃小鸟",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="score">得分: <span id="score">0</span></div>
        <canvas id="gameCanvas" width="400" height="500"></canvas>
        <div class="controls">
            <p>按空格键或点击屏幕让小鸟跳跃</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #87CEEB 0%, #4a90a4 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    padding: 2rem;
    border-radius: 20px;
}
h1 { color: #fff; margin-bottom: 1rem; font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
.score { color: #fff; font-size: 1.3rem; margin-bottom: 1rem; }
#gameCanvas { background: linear-gradient(#87CEEB, #4a90a4); border-radius: 10px; cursor: pointer; }
.controls { margin-top: 1rem; }
.controls p { color: #fff; margin-bottom: 1rem; }
#startBtn {
    padding: 12px 30px; font-size: 1rem;
    background: #ffcc00; color: #333;
    border: none; border-radius: 25px; cursor: pointer;
}
#startBtn:hover { transform: scale(1.05); background: #ffd633; }''',
        "js": '''const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');

const birdSize = 25;
const pipeWidth = 50;
const pipeGap = 150;
let birdY, birdVelocity;
let pipes = [];
let score = 0;
let gameLoop = null;
let gameRunning = false;

function drawBird() {
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(100, birdY, birdSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(110, birdY - 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(112, birdY - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(125, birdY);
    ctx.lineTo(135, birdY - 5);
    ctx.lineTo(135, birdY + 5);
    ctx.fill();
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(pipe.x - 5, pipe.top - 20, pipeWidth + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.top + pipeGap, pipeWidth + 10, 20);
    });
}

function update() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 地面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 10);
    
    birdVelocity += 0.5;
    birdY += birdVelocity;
    
    pipes.forEach(pipe => pipe.x -= 3);
    
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        const top = Math.random() * (canvas.height - pipeGap - 100) + 50;
        pipes.push({ x: canvas.width, top, passed: false });
    }
    
    pipes = pipes.filter(pipe => pipe.x > -pipeWidth);
    
    // 碰撞检测
    pipes.forEach(pipe => {
        if (100 + birdSize > pipe.x && 100 - birdSize < pipe.x + pipeWidth) {
            if (birdY - birdSize < pipe.top || birdY + birdSize > pipe.top + pipeGap) {
                gameOver();
            }
        }
        if (!pipe.passed && pipe.x + pipeWidth < 100) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = score;
        }
    });
    
    if (birdY + birdSize > canvas.height - 30 || birdY - birdSize < 0) gameOver();
    
    drawPipes();
    drawBird();
}

function flap() {
    if (gameRunning) birdVelocity = -10;
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width/2, canvas.height/2 + 20);
    startBtn.textContent = '重新开始';
}

function startGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    pipes = [];
    score = 0;
    scoreElement.textContent = 0;
    gameRunning = true;
    startBtn.textContent = '游戏中...';
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 20);
}

document.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); flap(); } });
canvas.addEventListener('click', flap);
startBtn.addEventListener('click', startGame);
update();'''
    },
    
    "memory": {
        "title": "记忆翻牌",
        "html": '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <h1>{title}</h1>
        <div class="game-info">
            <div class="moves">步数: <span id="moves">0</span></div>
            <div class="pairs">配对: <span id="pairs">0</span>/8</div>
        </div>
        <div id="gameBoard" class="game-board"></div>
        <div class="controls">
            <p>找出所有相同的配对!</p>
            <button id="startBtn">开始游戏</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>''',
        "css": '''* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.game-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 20px;
}
h1 { color: #ffeaa7; margin-bottom: 1rem; }
.game-info { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem; color: #fff; }
.game-board {
    display: grid;
    grid-template-columns: repeat(4, 80px);
    gap: 10px;
    justify-content: center;
    margin: 0 auto;
}
.card {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    transition: transform 0.3s;
    transform-style: preserve-3d;
}
.card.flipped { transform: rotateY(180deg); background: #fff; }
.card.matched { background: #00b894; transform: rotateY(180deg); }
.card span { transform: rotateY(180deg); }
.controls { margin-top: 1rem; }
.controls p { color: #ddd; margin-bottom: 1rem; }
#startBtn {
    padding: 12px 30px;
    background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
    color: #2d3436; border: none; border-radius: 25px; cursor: pointer;
}
#startBtn:hover { transform: scale(1.05); }''',
        "js": '''const gameBoard = document.getElementById('gameBoard');
const movesElement = document.getElementById('moves');
const pairsElement = document.getElementById('pairs');
const startBtn = document.getElementById('startBtn');

const emojis = ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺'];
let cards = [];
let flippedCards = [];
let moves = 0;
let pairs = 0;
let canFlip = true;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createBoard() {
    gameBoard.innerHTML = '';
    const cardPairs = [...emojis, ...emojis];
    shuffle(cardPairs);
    
    cards = cardPairs.map((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.innerHTML = '<span style="opacity:0">' + emoji + '</span>';
        card.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(card);
        return card;
    });
}

function flipCard(card) {
    if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    card.querySelector('span').style.opacity = '1';
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moves++;
        movesElement.textContent = moves;
        canFlip = false;
        
        const [card1, card2] = flippedCards;
        if (card1.dataset.emoji === card2.dataset.emoji) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            pairs++;
            pairsElement.textContent = pairs;
            flippedCards = [];
            canFlip = true;
            
            if (pairs === emojis.length) {
                setTimeout(() => {
                    alert('恭喜通关! 用了 ' + moves + ' 步');
                    startBtn.textContent = '再玩一次';
                }, 500);
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                card1.querySelector('span').style.opacity = '0';
                card2.querySelector('span').style.opacity = '0';
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }
}

function startGame() {
    moves = 0;
    pairs = 0;
    movesElement.textContent = 0;
    pairsElement.textContent = 0;
    flippedCards = [];
    canFlip = true;
    createBoard();
    startBtn.textContent = '重新开始';
}

startBtn.addEventListener('click', startGame);
createBoard();'''
    }
}


def generate_from_template(game_type: str, output_dir: Path, title: Optional[str] = None):
    """使用模板生成游戏"""
    if game_type not in GAME_TEMPLATES:
        print(f"错误: 不支持的游戏类型 '{game_type}'")
        print(f"支持的类型: {', '.join(GAME_TEMPLATES.keys())}")
        sys.exit(1)
    
    template = GAME_TEMPLATES[game_type]
    game_title = title or template["title"]
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 写入HTML
    html_content = template["html"].format(title=game_title)
    (output_dir / "index.html").write_text(html_content, encoding="utf-8")
    print(f"✓ 已生成: {output_dir / 'index.html'}")
    
    # 写入CSS
    (output_dir / "style.css").write_text(template["css"], encoding="utf-8")
    print(f"✓ 已生成: {output_dir / 'style.css'}")
    
    # 写入JS
    (output_dir / "game.js").write_text(template["js"], encoding="utf-8")
    print(f"✓ 已生成: {output_dir / 'game.js'}")
    
    print(f"\n🎮 {game_title} 生成完成！用浏览器打开以下文件即可游玩:")
    print(f"   {output_dir / 'index.html'}")


# ============ Main ============

def main():
    parser = argparse.ArgumentParser(
        description="HTML5游戏代码生成器 - 支持AI生成和模板生成两种模式"
    )
    
    parser.add_argument(
        "--mode", "-m",
        choices=["ai", "template"],
        default="template",
        help="生成模式: ai (AI大模型生成) 或 template (模板生成)"
    )
    
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="输出目录路径"
    )
    
    # AI模式参数
    parser.add_argument(
        "--prompt", "-p",
        help="游戏需求描述 (AI模式必需)"
    )
    
    parser.add_argument(
        "--model",
        default="gpt-4o",
        help="AI模型名称 (默认: gpt-4o)"
    )
    
    parser.add_argument(
        "--api-key",
        help="API Key (也可通过环境变量设置)"
    )
    
    # 模板模式参数
    parser.add_argument(
        "--type", "-t",
        choices=list(GAME_TEMPLATES.keys()),
        help="游戏模板类型 (模板模式必需)"
    )
    
    parser.add_argument(
        "--title",
        help="游戏标题 (可选)"
    )
    
    parser.add_argument(
        "--force", "-f",
        action="store_true",
        help="强制覆盖非空目录，不提示确认"
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output).expanduser().resolve()
    
    # 检查输出目录
    if output_dir.exists() and any(output_dir.iterdir()):
        print(f"警告: 输出目录 '{output_dir}' 不为空")
        if not args.force:
            # 检查是否在交互式终端中
            if sys.stdin.isatty():
                response = input("是否继续并覆盖? (y/N): ")
                if response.lower() != 'y':
                    print("已取消")
                    sys.exit(0)
            else:
                # 非交互式环境，自动继续
                print("非交互式环境，自动继续...")
    
    if args.mode == "ai":
        if not args.prompt:
            print("错误: AI模式需要 --prompt 参数指定游戏需求")
            sys.exit(1)
        generate_with_ai(args.prompt, output_dir, args.model, args.api_key)
    else:
        if not args.type:
            print("错误: 模板模式需要 --type 参数指定游戏类型")
            print(f"可选类型: {', '.join(GAME_TEMPLATES.keys())}")
            sys.exit(1)
        generate_from_template(args.type, output_dir, args.title)


if __name__ == "__main__":
    main()
