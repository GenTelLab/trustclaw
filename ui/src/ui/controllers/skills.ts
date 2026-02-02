import type { GatewayBrowserClient } from "../gateway";
import type { SkillStatusReport } from "../types";
import type { GameCodeConfig, GameCodeState } from "../views/skills";

export type SkillsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  skillsLoading: boolean;
  skillsReport: SkillStatusReport | null;
  skillsError: string | null;
  skillsBusyKey: string | null;
  skillEdits: Record<string, string>;
  skillMessages: SkillMessageMap;
  // Game Code 专用状态
  gameCodeState: GameCodeState;
};

// 初始化 Game Code 状态
export function createInitialGameCodeState(): GameCodeState {
  return {
    config: {
      outputDir: "",
      mode: "template",
      gameType: "snake",
      title: "",
      prompt: "",
      model: "gpt-4o",
      apiKey: "",
    },
    running: false,
    output: "",
    error: null,
    success: false,
  };
}

export type SkillMessage = {
  kind: "success" | "error";
  message: string;
};

export type SkillMessageMap = Record<string, SkillMessage>;

type LoadSkillsOptions = {
  clearMessages?: boolean;
};

function setSkillMessage(state: SkillsState, key: string, message?: SkillMessage) {
  if (!key.trim()) return;
  const next = { ...state.skillMessages };
  if (message) next[key] = message;
  else delete next[key];
  state.skillMessages = next;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function loadSkills(state: SkillsState, options?: LoadSkillsOptions) {
  if (options?.clearMessages && Object.keys(state.skillMessages).length > 0) {
    state.skillMessages = {};
  }
  if (!state.client || !state.connected) return;
  if (state.skillsLoading) return;
  state.skillsLoading = true;
  state.skillsError = null;
  try {
    const res = (await state.client.request("skills.status", {})) as
      | SkillStatusReport
      | undefined;
    if (res) state.skillsReport = res;
  } catch (err) {
    state.skillsError = getErrorMessage(err);
  } finally {
    state.skillsLoading = false;
  }
}

export function updateSkillEdit(
  state: SkillsState,
  skillKey: string,
  value: string,
) {
  state.skillEdits = { ...state.skillEdits, [skillKey]: value };
}

export async function updateSkillEnabled(
  state: SkillsState,
  skillKey: string,
  enabled: boolean,
) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    await state.client.request("skills.update", { skillKey, enabled });
    await loadSkills(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: enabled ? "Skill enabled" : "Skill disabled",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

export async function saveSkillApiKey(state: SkillsState, skillKey: string) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    const apiKey = state.skillEdits[skillKey] ?? "";
    await state.client.request("skills.update", { skillKey, apiKey });
    await loadSkills(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: "API key saved",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

export async function installSkill(
  state: SkillsState,
  skillKey: string,
  name: string,
  installId: string,
) {
  if (!state.client || !state.connected) return;
  state.skillsBusyKey = skillKey;
  state.skillsError = null;
  try {
    const result = (await state.client.request("skills.install", {
      name,
      installId,
      timeoutMs: 120000,
    })) as { ok?: boolean; message?: string };
    await loadSkills(state);
    setSkillMessage(state, skillKey, {
      kind: "success",
      message: result?.message ?? "Installed",
    });
  } catch (err) {
    const message = getErrorMessage(err);
    state.skillsError = message;
    setSkillMessage(state, skillKey, {
      kind: "error",
      message,
    });
  } finally {
    state.skillsBusyKey = null;
  }
}

// ============ Game Code 专用函数 ============

export function updateGameCodeConfig(state: SkillsState, config: Partial<GameCodeConfig>) {
  state.gameCodeState = {
    ...state.gameCodeState,
    config: { ...state.gameCodeState.config, ...config },
    // 清除之前的结果
    ...(config.mode !== undefined || config.outputDir !== undefined
      ? { output: "", error: null, success: false }
      : {}),
  };
}

export async function runGameCode(state: SkillsState) {
  if (!state.client || !state.connected) return;
  if (state.gameCodeState.running) return;
  
  const config = state.gameCodeState.config;
  if (!config.outputDir) {
    state.gameCodeState = {
      ...state.gameCodeState,
      error: "请先设置输出目录",
      output: "",
      success: false,
    };
    return;
  }
  
  state.gameCodeState = {
    ...state.gameCodeState,
    running: true,
    output: "正在生成游戏...\n",
    error: null,
    success: false,
  };
  
  try {
    // 调用后端执行 skill
    const result = (await state.client.request("skills.runGameCode", {
      mode: config.mode,
      outputDir: config.outputDir,
      gameType: config.gameType,
      title: config.title,
      prompt: config.prompt,
      model: config.model,
      apiKey: config.apiKey,
    })) as { ok: boolean; output?: string; error?: string };
    
    state.gameCodeState = {
      ...state.gameCodeState,
      running: false,
      output: result.output ?? "",
      error: result.error ?? null,
      success: result.ok,
    };
  } catch (err) {
    state.gameCodeState = {
      ...state.gameCodeState,
      running: false,
      error: getErrorMessage(err),
      success: false,
    };
  }
}

export function stopGameCode(state: SkillsState) {
  if (!state.client || !state.connected) return;
  // 发送停止信号
  state.client.request("skills.stopGameCode", {}).catch(() => {});
  state.gameCodeState = {
    ...state.gameCodeState,
    running: false,
    output: state.gameCodeState.output + "\n已停止",
  };
}
