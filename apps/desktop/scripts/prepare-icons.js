/**
 * 图标准备脚本
 * 将 PNG 图标复制到 build 目录
 * 
 * 注意: Windows ICO 和 macOS ICNS 格式需要专门的工具转换
 * - Windows: 可以使用 PNG 作为源，electron-builder 会自动处理
 * - macOS: 需要 iconutil 或 png2icns 工具（仅在 macOS 上可用）
 */

import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..");
const buildDir = join(appDir, "build");
const rendererDir = join(appDir, "renderer");

// 确保 build 目录存在
if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

// 源图标
const sourcePng = join(rendererDir, "logo.png");

if (!existsSync(sourcePng)) {
  console.error("错误: 未找到源图标文件", sourcePng);
  process.exit(1);
}

// 复制 PNG 到 build 目录作为备用
copyFileSync(sourcePng, join(buildDir, "icon.png"));
console.log("✓ 复制 icon.png 到 build/");

// Windows: electron-builder 可以直接使用 PNG，也可以手动转换为 ICO
// 如果没有 ICO 文件，就用 PNG
const icoPath = join(buildDir, "icon.ico");
if (!existsSync(icoPath)) {
  // 直接复制 PNG，electron-builder 会尝试使用它
  copyFileSync(sourcePng, icoPath);
  console.log("✓ 创建 icon.ico (从 PNG 复制，建议用专业工具转换)");
}

// macOS: 需要 .icns 文件
// 在 Windows 上我们只能创建一个占位符，实际构建需要在 macOS 上完成
const icnsPath = join(buildDir, "icon.icns");
if (!existsSync(icnsPath)) {
  // 在 macOS 上可以用: iconutil -c icns iconset.iconset
  // 或者使用 png2icns 工具
  console.log("⚠ macOS 图标 (icon.icns) 需要在 macOS 上生成");
  console.log("  运行: iconutil -c icns iconset.iconset");
  console.log("  或使用在线转换工具: https://cloudconvert.com/png-to-icns");
}

console.log("");
console.log("图标准备完成！");
console.log("build/ 目录:", buildDir);
