const KEY = "openclaw.control.settings.v1";
const AGENT_ACCOUNTS_KEY = "openclaw.control.agent-accounts.v1";

import type { ThemeMode } from "./theme";

export type Lang = "zh" | "en";

// Agent Model types
export type AgentModel = {
  id: string;
  name: string;           // 显示名称
  provider: string;       // 模型提供商 (openai, anthropic, moonshot, etc.)
  modelId: string;        // 模型ID (gpt-4, claude-3-opus, moonshot-v1, etc.)
  apiKey: string;         // API密钥
  baseUrl: string;        // 可选的API基础URL
  createdAt: number;
  updatedAt: number;
};

export type AgentModelsData = {
  models: AgentModel[];
  activeModelId: string | null;
};

export type UiSettings = {
  gatewayUrl: string;
  token: string;
  sessionKey: string;
  lastActiveSessionKey: string;
  theme: ThemeMode;
  chatFocusMode: boolean;
  chatShowThinking: boolean;
  splitRatio: number; // Sidebar split ratio (0.4 to 0.7, default 0.6)
  navCollapsed: boolean; // Collapsible sidebar state
  navGroupsCollapsed: Record<string, boolean>; // Which nav groups are collapsed
  selectedPosition?: string; // Selected job position (e.g., "finance")
  lang: Lang; // UI language (zh = Chinese, en = English)
};

export function loadSettings(): UiSettings {
  const defaultUrl = (() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}`;
  })();

  const defaults: UiSettings = {
    gatewayUrl: defaultUrl,
    token: "",
    sessionKey: "main",
    lastActiveSessionKey: "main",
    theme: "system",
    chatFocusMode: false,
    chatShowThinking: true,
    splitRatio: 0.6,
    navCollapsed: false,
    navGroupsCollapsed: {},
    lang: "zh",
  };

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UiSettings>;
    return {
      gatewayUrl:
        typeof parsed.gatewayUrl === "string" && parsed.gatewayUrl.trim()
          ? parsed.gatewayUrl.trim()
          : defaults.gatewayUrl,
      token: typeof parsed.token === "string" ? parsed.token : defaults.token,
      sessionKey:
        typeof parsed.sessionKey === "string" && parsed.sessionKey.trim()
          ? parsed.sessionKey.trim()
          : defaults.sessionKey,
      lastActiveSessionKey:
        typeof parsed.lastActiveSessionKey === "string" &&
        parsed.lastActiveSessionKey.trim()
          ? parsed.lastActiveSessionKey.trim()
          : (typeof parsed.sessionKey === "string" &&
              parsed.sessionKey.trim()) ||
            defaults.lastActiveSessionKey,
      theme:
        parsed.theme === "light" ||
        parsed.theme === "dark" ||
        parsed.theme === "system"
          ? parsed.theme
          : defaults.theme,
      chatFocusMode:
        typeof parsed.chatFocusMode === "boolean"
          ? parsed.chatFocusMode
          : defaults.chatFocusMode,
      chatShowThinking:
        typeof parsed.chatShowThinking === "boolean"
          ? parsed.chatShowThinking
          : defaults.chatShowThinking,
      splitRatio:
        typeof parsed.splitRatio === "number" &&
        parsed.splitRatio >= 0.4 &&
        parsed.splitRatio <= 0.7
          ? parsed.splitRatio
          : defaults.splitRatio,
      navCollapsed:
        typeof parsed.navCollapsed === "boolean"
          ? parsed.navCollapsed
          : defaults.navCollapsed,
      navGroupsCollapsed:
        typeof parsed.navGroupsCollapsed === "object" &&
        parsed.navGroupsCollapsed !== null
          ? parsed.navGroupsCollapsed
          : defaults.navGroupsCollapsed,
      selectedPosition:
        typeof parsed.selectedPosition === "string" && parsed.selectedPosition.trim()
          ? parsed.selectedPosition.trim()
          : undefined,
      lang:
        parsed.lang === "zh" || parsed.lang === "en"
          ? parsed.lang
          : defaults.lang,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(next: UiSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

// Agent Models storage
export function loadAgentModels(): AgentModelsData {
  const defaults: AgentModelsData = {
    models: [],
    activeModelId: null,
  };

  try {
    const raw = localStorage.getItem(AGENT_ACCOUNTS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    
    // Handle new format (models)
    if (Array.isArray(parsed.models)) {
      return {
        models: parsed.models as AgentModel[],
        activeModelId:
          typeof parsed.activeModelId === "string"
            ? parsed.activeModelId
            : null,
      };
    }
    
    // Clear old format data (accounts) and return defaults
    if (Array.isArray(parsed.accounts)) {
      localStorage.removeItem(AGENT_ACCOUNTS_KEY);
      return defaults;
    }
    
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveAgentModels(data: AgentModelsData) {
  localStorage.setItem(AGENT_ACCOUNTS_KEY, JSON.stringify(data));
}

export function generateModelId(): string {
  return `model-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
