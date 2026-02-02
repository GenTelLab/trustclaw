import type { IconName } from "./icons.js";

export const TAB_GROUPS = [
  { label: "Chat", tabs: ["chat"] },
  {
    label: "Control",
    tabs: ["overview", "channels", "instances", "sessions", "cron", "security"],
  },
  { label: "Agent", tabs: ["skills", "nodes", "models"] },
  { label: "Settings", tabs: ["config", "debug", "logs"] },
] as const;

export type Tab =
  | "overview"
  | "channels"
  | "instances"
  | "sessions"
  | "cron"
  | "security"
  | "skills"
  | "nodes"
  | "models"
  | "position"
  | "chat"
  | "config"
  | "debug"
  | "logs";

const TAB_PATHS: Record<Tab, string> = {
  overview: "/overview",
  channels: "/channels",
  instances: "/instances",
  sessions: "/sessions",
  cron: "/cron",
  security: "/security",
  skills: "/skills",
  nodes: "/nodes",
  models: "/models",
  position: "/position",
  chat: "/chat",
  config: "/config",
  debug: "/debug",
  logs: "/logs",
};

const PATH_TO_TAB = new Map(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]),
);

export function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "chat";
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") return "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): IconName {
  switch (tab) {
    case "chat":
      return "messageSquare";
    case "overview":
      return "barChart";
    case "channels":
      return "link";
    case "instances":
      return "radio";
    case "sessions":
      return "fileText";
    case "cron":
      return "loader";
    case "security":
      return "shield";
    case "skills":
      return "zap";
    case "nodes":
      return "monitor";
    case "models":
      return "box";
    case "position":
      return "briefcase";
    case "config":
      return "settings";
    case "debug":
      return "bug";
    case "logs":
      return "scrollText";
    default:
      return "folder";
  }
}

type Lang = "zh" | "en";

const TAB_TITLES: Record<Tab, { zh: string; en: string }> = {
  overview: { zh: "概览", en: "Overview" },
  channels: { zh: "频道", en: "Channels" },
  instances: { zh: "实例", en: "Instances" },
  sessions: { zh: "会话", en: "Sessions" },
  cron: { zh: "定时任务", en: "Cron Jobs" },
  security: { zh: "安全", en: "Security" },
  skills: { zh: "技能", en: "Skills" },
  nodes: { zh: "节点", en: "Nodes" },
  models: { zh: "模型", en: "Models" },
  position: { zh: "岗位", en: "Position" },
  chat: { zh: "对话", en: "Chat" },
  config: { zh: "配置", en: "Config" },
  debug: { zh: "调试", en: "Debug" },
  logs: { zh: "日志", en: "Logs" },
};

const TAB_SUBTITLES: Record<Tab, { zh: string; en: string }> = {
  overview: { zh: "Gateway 状态、入口点和健康检查", en: "Gateway status, entry points, and a fast health read." },
  channels: { zh: "管理频道和设置", en: "Manage channels and settings." },
  instances: { zh: "来自已连接客户端和节点的存在信标", en: "Presence beacons from connected clients and nodes." },
  sessions: { zh: "查看活动会话和调整会话默认设置", en: "Inspect active sessions and adjust per-session defaults." },
  cron: { zh: "安排唤醒和定期代理运行", en: "Schedule wakeups and recurring agent runs." },
  security: { zh: "安全网关配置和 Bot 安全设置", en: "Security gateway configuration and bot security settings." },
  skills: { zh: "管理技能可用性和 API 密钥注入", en: "Manage skill availability and API key injection." },
  nodes: { zh: "配对设备、能力和命令暴露", en: "Paired devices, capabilities, and command exposure." },
  models: { zh: "配置 Agent 使用的大模型", en: "Configure LLM models for Agent." },
  position: { zh: "配置基于岗位的代理能力和技能", en: "Configure position-based agent capabilities and skills." },
  chat: { zh: "直接 Gateway 聊天会话，用于快速干预", en: "Direct gateway chat session for quick interventions." },
  config: { zh: "安全编辑 ~/.openclaw/openclaw.json", en: "Edit ~/.openclaw/openclaw.json safely." },
  debug: { zh: "Gateway 快照、事件和手动 RPC 调用", en: "Gateway snapshots, events, and manual RPC calls." },
  logs: { zh: "实时查看 Gateway 文件日志", en: "Live tail of the gateway file logs." },
};

const GROUP_TITLES: Record<string, { zh: string; en: string }> = {
  Chat: { zh: "对话", en: "Chat" },
  Control: { zh: "控制", en: "Control" },
  Agent: { zh: "代理", en: "Agent" },
  Settings: { zh: "设置", en: "Settings" },
  Resources: { zh: "资源", en: "Resources" },
};

export function titleForTab(tab: Tab, lang: Lang = "en") {
  return TAB_TITLES[tab]?.[lang] || TAB_TITLES[tab]?.en || "Control";
}

export function subtitleForTab(tab: Tab, lang: Lang = "en") {
  return TAB_SUBTITLES[tab]?.[lang] || TAB_SUBTITLES[tab]?.en || "";
}

export function titleForGroup(group: string, lang: Lang = "en") {
  return GROUP_TITLES[group]?.[lang] || GROUP_TITLES[group]?.en || group;
}
