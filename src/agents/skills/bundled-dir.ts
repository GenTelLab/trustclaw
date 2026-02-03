import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveBundledSkillsDir(): string | undefined {
  const override = process.env.OPENCLAW_BUNDLED_SKILLS_DIR?.trim();
  if (override && fs.existsSync(override)) return override;

  // Electron packaged app: check resources/skills (process.resourcesPath is set by Electron)
  try {
    const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
    if (resourcesPath) {
      const electronSkills = path.join(resourcesPath, "skills");
      if (fs.existsSync(electronSkills)) return electronSkills;
    }
  } catch {
    // ignore
  }

  // Packaged Electron app with external Node.js:
  // Structure: resources/openclaw/dist/entry.js, resources/skills/
  // From this module (dist/agents/skills/bundled-dir.js), go up to find resources/skills
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    // moduleDir = .../resources/openclaw/dist/agents/skills
    // Go up to resources: openclaw/dist/agents/skills -> openclaw/dist/agents -> openclaw/dist -> openclaw -> resources
    const resourcesDir = path.resolve(moduleDir, "..", "..", "..", "..");
    const resourcesSkills = path.join(resourcesDir, "skills");
    if (fs.existsSync(resourcesSkills)) return resourcesSkills;
  } catch {
    // ignore
  }

  // bun --compile: ship a sibling `skills/` next to the executable.
  try {
    const execDir = path.dirname(process.execPath);
    const sibling = path.join(execDir, "skills");
    if (fs.existsSync(sibling)) return sibling;
  } catch {
    // ignore
  }

  // Electron fallback: check resources/skills relative to executable
  try {
    const execDir = path.dirname(process.execPath);
    const resourcesSkills = path.join(execDir, "resources", "skills");
    if (fs.existsSync(resourcesSkills)) return resourcesSkills;
  } catch {
    // ignore
  }

  // npm/dev: resolve `<packageRoot>/skills` relative to this module.
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const root = path.resolve(moduleDir, "..", "..", "..");
    const candidate = path.join(root, "skills");
    if (fs.existsSync(candidate)) return candidate;
  } catch {
    // ignore
  }

  return undefined;
}
