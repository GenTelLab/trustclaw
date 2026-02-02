// 启动脚本：自动查找并使用 Electron
import { spawn, execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查 Electron 二进制文件是否存在
function findElectronExe() {
  const possiblePaths = [
    // pnpm workspace - electron.exe
    join(__dirname, "..", "..", "node_modules", ".pnpm", "electron@32.3.3", "node_modules", "electron", "dist", "electron.exe"),
    // 本地 node_modules - electron.exe
    join(__dirname, "node_modules", "electron", "dist", "electron.exe"),
  ];

  for (const exePath of possiblePaths) {
    if (existsSync(exePath)) {
      return exePath;
    }
  }

  // 检查全局安装
  try {
    execSync("electron -v", { stdio: "ignore" });
    return "electron"; // 使用全局 electron
  } catch {
    return null;
  }
}

// 尝试下载 Electron 二进制文件
async function downloadElectron() {
  const electronPath = join(__dirname, "..", "..", "node_modules", ".pnpm", "electron@32.3.3", "node_modules", "electron");
  const installScript = join(electronPath, "install.js");
  
  if (!existsSync(installScript)) {
    console.error("❌ 找不到 Electron 安装脚本");
    return false;
  }

  console.log("正在下载 Electron 二进制文件...");
  try {
    // 设置镜像源
    process.env.ELECTRON_MIRROR = process.env.ELECTRON_MIRROR || "https://npmmirror.com/mirrors/electron/";
    
    // 运行安装脚本
    execSync(`node "${installScript}"`, {
      cwd: electronPath,
      stdio: "inherit",
    });
    
    // 检查是否下载成功
    const electronExe = join(electronPath, "dist", "electron.exe");
    if (existsSync(electronExe)) {
      console.log("✓ Electron 下载成功");
      return true;
    }
  } catch (err) {
    console.error("下载失败:", err.message);
  }
  
  return false;
}

// 主逻辑
let electronExe = findElectronExe();

if (!electronExe) {
  console.log("Electron 二进制文件未找到，尝试下载...");
  const downloaded = await downloadElectron();
  
  if (downloaded) {
    electronExe = findElectronExe();
  }
  
  if (!electronExe) {
    console.error("\n❌ Electron 未找到或下载失败！");
    console.error("\n请尝试以下方法之一：");
    console.error("1. 全局安装: npm install -g electron@32.3.3");
    console.error("2. 手动下载: 访问 https://github.com/electron/electron/releases/tag/v32.3.3");
    console.error("3. 设置镜像后重试: $env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'");
    process.exit(1);
  }
}

console.log(`✓ 找到 Electron: ${electronExe}`);

// 启动 Electron
const args = process.argv.slice(2);
const appArgs = electronExe === "electron" ? args : [electronExe, ...args];

// 修复安全警告：不使用 shell: true，直接执行
const child = spawn(
  electronExe === "electron" ? "electron" : electronExe,
  args,
  {
    cwd: __dirname,
    stdio: "inherit",
    shell: false, // 修复安全警告
  }
);

child.on("error", (err) => {
  console.error("启动 Electron 失败:", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
