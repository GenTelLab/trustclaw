import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { installSkill } from "../../agents/skills-install.js";
import { buildWorkspaceSkillStatus } from "../../agents/skills-status.js";
import { loadWorkspaceSkillEntries, type SkillEntry } from "../../agents/skills.js";
import type { OpenClawConfig } from "../../config/config.js";
import { loadConfig, writeConfigFile } from "../../config/config.js";
import { getRemoteSkillEligibility } from "../../infra/skills-remote.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateSkillsBinsParams,
  validateSkillsInstallParams,
  validateSkillsStatusParams,
  validateSkillsUpdateParams,
} from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

// Game Code 进程跟踪
let gameCodeProcess: ChildProcess | null = null;

function listWorkspaceDirs(cfg: OpenClawConfig): string[] {
  const dirs = new Set<string>();
  const list = cfg.agents?.list;
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (entry && typeof entry === "object" && typeof entry.id === "string") {
        dirs.add(resolveAgentWorkspaceDir(cfg, entry.id));
      }
    }
  }
  dirs.add(resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)));
  return [...dirs];
}

function collectSkillBins(entries: SkillEntry[]): string[] {
  const bins = new Set<string>();
  for (const entry of entries) {
    const required = entry.metadata?.requires?.bins ?? [];
    const anyBins = entry.metadata?.requires?.anyBins ?? [];
    const install = entry.metadata?.install ?? [];
    for (const bin of required) {
      const trimmed = bin.trim();
      if (trimmed) bins.add(trimmed);
    }
    for (const bin of anyBins) {
      const trimmed = bin.trim();
      if (trimmed) bins.add(trimmed);
    }
    for (const spec of install) {
      const specBins = spec?.bins ?? [];
      for (const bin of specBins) {
        const trimmed = String(bin).trim();
        if (trimmed) bins.add(trimmed);
      }
    }
  }
  return [...bins].sort();
}

export const skillsHandlers: GatewayRequestHandlers = {
  "skills.status": ({ params, respond }) => {
    if (!validateSkillsStatusParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.status params: ${formatValidationErrors(validateSkillsStatusParams.errors)}`,
        ),
      );
      return;
    }
    const cfg = loadConfig();
    const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    const report = buildWorkspaceSkillStatus(workspaceDir, {
      config: cfg,
      eligibility: { remote: getRemoteSkillEligibility() },
    });
    respond(true, report, undefined);
  },
  "skills.bins": ({ params, respond }) => {
    if (!validateSkillsBinsParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.bins params: ${formatValidationErrors(validateSkillsBinsParams.errors)}`,
        ),
      );
      return;
    }
    const cfg = loadConfig();
    const workspaceDirs = listWorkspaceDirs(cfg);
    const bins = new Set<string>();
    for (const workspaceDir of workspaceDirs) {
      const entries = loadWorkspaceSkillEntries(workspaceDir, { config: cfg });
      for (const bin of collectSkillBins(entries)) bins.add(bin);
    }
    respond(true, { bins: [...bins].sort() }, undefined);
  },
  "skills.install": async ({ params, respond }) => {
    if (!validateSkillsInstallParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.install params: ${formatValidationErrors(validateSkillsInstallParams.errors)}`,
        ),
      );
      return;
    }
    const p = params as {
      name: string;
      installId: string;
      timeoutMs?: number;
    };
    const cfg = loadConfig();
    const workspaceDirRaw = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    const result = await installSkill({
      workspaceDir: workspaceDirRaw,
      skillName: p.name,
      installId: p.installId,
      timeoutMs: p.timeoutMs,
      config: cfg,
    });
    respond(
      result.ok,
      result,
      result.ok ? undefined : errorShape(ErrorCodes.UNAVAILABLE, result.message),
    );
  },
  "skills.update": async ({ params, respond }) => {
    if (!validateSkillsUpdateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid skills.update params: ${formatValidationErrors(validateSkillsUpdateParams.errors)}`,
        ),
      );
      return;
    }
    const p = params as {
      skillKey: string;
      enabled?: boolean;
      apiKey?: string;
      env?: Record<string, string>;
    };
    const cfg = loadConfig();
    const skills = cfg.skills ? { ...cfg.skills } : {};
    const entries = skills.entries ? { ...skills.entries } : {};
    const current = entries[p.skillKey] ? { ...entries[p.skillKey] } : {};
    if (typeof p.enabled === "boolean") {
      current.enabled = p.enabled;
    }
    if (typeof p.apiKey === "string") {
      const trimmed = p.apiKey.trim();
      if (trimmed) current.apiKey = trimmed;
      else delete current.apiKey;
    }
    if (p.env && typeof p.env === "object") {
      const nextEnv = current.env ? { ...current.env } : {};
      for (const [key, value] of Object.entries(p.env)) {
        const trimmedKey = key.trim();
        if (!trimmedKey) continue;
        const trimmedVal = value.trim();
        if (!trimmedVal) delete nextEnv[trimmedKey];
        else nextEnv[trimmedKey] = trimmedVal;
      }
      current.env = nextEnv;
    }
    entries[p.skillKey] = current;
    skills.entries = entries;
    const nextConfig: OpenClawConfig = {
      ...cfg,
      skills,
    };
    await writeConfigFile(nextConfig);
    respond(true, { ok: true, skillKey: p.skillKey, config: current }, undefined);
  },
  
  // Game Code skill 执行
  "skills.runGameCode": async ({ params, respond }) => {
    const p = params as {
      mode: "template" | "ai";
      outputDir: string;
      gameType?: string;
      title?: string;
      prompt?: string;
      model?: string;
      apiKey?: string;
    };
    
    if (!p.outputDir) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "outputDir is required"));
      return;
    }
    
    // 查找 skill 脚本路径
    const cfg = loadConfig();
    const workspaceDir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
    
    // 尝试多个可能的路径
    const possiblePaths = [
      join(workspaceDir, "skills", "game-code", "scripts", "game_gen.py"),
      join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "skills", "game-code", "scripts", "game_gen.py"),
    ];
    
    let scriptPath: string | null = null;
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        scriptPath = p;
        break;
      }
    }
    
    if (!scriptPath) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "game-code skill script not found"));
      return;
    }
    
    // 构建命令参数
    const args: string[] = ["--force"]; // 自动覆盖，避免交互式确认
    
    if (p.mode === "ai") {
      args.push("--mode", "ai");
      if (p.prompt) args.push("--prompt", p.prompt);
      if (p.model) args.push("--model", p.model);
      if (p.apiKey) args.push("--api-key", p.apiKey);
    } else {
      args.push("--mode", "template");
      if (p.gameType) args.push("--type", p.gameType);
      if (p.title) args.push("--title", p.title);
    }
    
    args.push("--output", p.outputDir);
    
    // 查找 Python
    const pythonCmds = process.platform === "win32" 
      ? ["python", "python3", "py"]
      : ["python3", "python"];
    
    let pythonCmd: string | null = null;
    for (const cmd of pythonCmds) {
      try {
        const { execSync } = await import("child_process");
        execSync(`${cmd} --version`, { stdio: "ignore" });
        pythonCmd = cmd;
        break;
      } catch {
        continue;
      }
    }
    
    if (!pythonCmd) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "Python not found. Please install Python 3.10+"));
      return;
    }
    
    // 执行脚本
    return new Promise<void>((resolve) => {
      let stdout = "";
      let stderr = "";
      
      gameCodeProcess = spawn(pythonCmd!, [scriptPath!, ...args], {
        shell: true,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1",
        },
      });
      
      gameCodeProcess.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      
      gameCodeProcess.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      
      gameCodeProcess.on("close", (code) => {
        gameCodeProcess = null;
        const ok = code === 0;
        respond(
          ok,
          { ok, output: stdout || stderr, code },
          ok ? undefined : errorShape(ErrorCodes.UNAVAILABLE, stderr || `Exit code: ${code}`),
        );
        resolve();
      });
      
      gameCodeProcess.on("error", (err) => {
        gameCodeProcess = null;
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, err.message));
        resolve();
      });
    });
  },
  
  // 停止 Game Code 执行
  "skills.stopGameCode": ({ respond }) => {
    if (gameCodeProcess && !gameCodeProcess.killed) {
      gameCodeProcess.kill();
      gameCodeProcess = null;
      respond(true, { ok: true, message: "Stopped" }, undefined);
    } else {
      respond(true, { ok: true, message: "Not running" }, undefined);
    }
  },
};
