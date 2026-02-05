import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

import type { GatewayBrowserClient, GatewayHelloOk } from "./gateway";
import { resolveInjectedAssistantIdentity } from "./assistant-identity";
import {
  loadSettings,
  loadAgentModels,
  saveAgentModels,
  generateModelId,
  type AgentModel,
  type AgentModelsData,
  type UiSettings,
} from "./storage";
import { renderApp } from "./app-render";
import type { Tab } from "./navigation";
import type { ResolvedTheme, ThemeMode } from "./theme";
import type {
  AgentsListResult,
  ConfigSnapshot,
  ConfigUiHints,
  ContentAuditApprovalRequest,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  PresenceEntry,
  ChannelsStatusSnapshot,
  SessionsListResult,
  SkillStatusReport,
  StatusSummary,
  NostrProfile,
} from "./types";
import { type ChatAttachment, type ChatQueueItem, type CronFormState } from "./ui-types";
import type { EventLogEntry } from "./app-events";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "./app-defaults";
import type {
  ExecApprovalsFile,
  ExecApprovalsSnapshot,
} from "./controllers/exec-approvals";
import type { DevicePairingList } from "./controllers/devices";
import type { ExecApprovalRequest } from "./controllers/exec-approval";
import {
  resetToolStream as resetToolStreamInternal,
  type ToolStreamEntry,
} from "./app-tool-stream";
import {
  exportLogs as exportLogsInternal,
  handleChatScroll as handleChatScrollInternal,
  handleLogsScroll as handleLogsScrollInternal,
  resetChatScroll as resetChatScrollInternal,
} from "./app-scroll";
import { connectGateway as connectGatewayInternal } from "./app-gateway";
import {
  handleConnected,
  handleDisconnected,
  handleFirstUpdated,
  handleUpdated,
} from "./app-lifecycle";
import {
  applySettings as applySettingsInternal,
  loadCron as loadCronInternal,
  loadOverview as loadOverviewInternal,
  setTab as setTabInternal,
  setTheme as setThemeInternal,
  onPopState as onPopStateInternal,
} from "./app-settings";
import {
  handleAbortChat as handleAbortChatInternal,
  handleSendChat as handleSendChatInternal,
  removeQueuedMessage as removeQueuedMessageInternal,
} from "./app-chat";
import {
  handleChannelConfigReload as handleChannelConfigReloadInternal,
  handleChannelConfigSave as handleChannelConfigSaveInternal,
  handleNostrProfileCancel as handleNostrProfileCancelInternal,
  handleNostrProfileEdit as handleNostrProfileEditInternal,
  handleNostrProfileFieldChange as handleNostrProfileFieldChangeInternal,
  handleNostrProfileImport as handleNostrProfileImportInternal,
  handleNostrProfileSave as handleNostrProfileSaveInternal,
  handleNostrProfileToggleAdvanced as handleNostrProfileToggleAdvancedInternal,
  handleWhatsAppLogout as handleWhatsAppLogoutInternal,
  handleWhatsAppStart as handleWhatsAppStartInternal,
  handleWhatsAppWait as handleWhatsAppWaitInternal,
} from "./app-channels";
import type { NostrProfileFormState } from "./views/channels.nostr-profile-form";
import { loadAssistantIdentity as loadAssistantIdentityInternal } from "./controllers/assistant-identity";

declare global {
  interface Window {
    __OPENCLAW_CONTROL_UI_BASE_PATH__?: string;
  }
}

const injectedAssistantIdentity = resolveInjectedAssistantIdentity();

function resolveOnboardingMode(): boolean {
  if (!window.location.search) return false;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("onboarding");
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

@customElement("openclaw-app")
export class OpenClawApp extends LitElement {
  @state() settings: UiSettings = loadSettings();
  @state() password = "";
  @state() tab: Tab = "chat";
  @state() onboarding = resolveOnboardingMode();
  @state() connected = false;
  @state() theme: ThemeMode = this.settings.theme ?? "system";
  @state() themeResolved: ResolvedTheme = "dark";
  @state() hello: GatewayHelloOk | null = null;
  @state() lastError: string | null = null;
  @state() eventLog: EventLogEntry[] = [];
  private eventLogBuffer: EventLogEntry[] = [];
  private toolStreamSyncTimer: number | null = null;
  private sidebarCloseTimer: number | null = null;

  @state() assistantName = injectedAssistantIdentity.name;
  @state() assistantAvatar = injectedAssistantIdentity.avatar;
  @state() assistantAgentId = injectedAssistantIdentity.agentId ?? null;

  @state() sessionKey = this.settings.sessionKey;
  @state() chatLoading = false;
  @state() chatSending = false;
  @state() chatMessage = "";
  @state() chatMessages: unknown[] = [];
  @state() chatToolMessages: unknown[] = [];
  @state() chatStream: string | null = null;
  @state() chatStreamStartedAt: number | null = null;
  @state() chatRunId: string | null = null;
  @state() compactionStatus: import("./app-tool-stream").CompactionStatus | null = null;
  @state() chatAvatarUrl: string | null = null;
  @state() chatThinkingLevel: string | null = null;
  @state() chatQueue: ChatQueueItem[] = [];
  @state() chatAttachments: ChatAttachment[] = [];
  // Sidebar state for tool output viewing
  @state() sidebarOpen = false;
  @state() sidebarContent: string | null = null;
  @state() sidebarError: string | null = null;
  @state() splitRatio = this.settings.splitRatio;

  @state() nodesLoading = false;
  @state() nodes: Array<Record<string, unknown>> = [];
  @state() devicesLoading = false;
  @state() devicesError: string | null = null;
  @state() devicesList: DevicePairingList | null = null;
  @state() execApprovalsLoading = false;
  @state() execApprovalsSaving = false;
  @state() execApprovalsDirty = false;
  @state() execApprovalsSnapshot: ExecApprovalsSnapshot | null = null;
  @state() execApprovalsForm: ExecApprovalsFile | null = null;
  @state() execApprovalsSelectedAgent: string | null = null;
  @state() execApprovalsTarget: "gateway" | "node" = "gateway";
  @state() execApprovalsTargetNodeId: string | null = null;
  @state() execApprovalQueue: ExecApprovalRequest[] = [];
  @state() execApprovalBusy = false;
  @state() execApprovalError: string | null = null;
  @state() contentAuditApprovalQueue: ContentAuditApprovalRequest[] = [];
  @state() contentAuditApprovalBusy = false;
  @state() contentAuditApprovalError: string | null = null;
  @state() pendingGatewayUrl: string | null = null;

  @state() configLoading = false;
  @state() configRaw = "{\n}\n";
  @state() configRawOriginal = "";
  @state() configValid: boolean | null = null;
  @state() configIssues: unknown[] = [];
  @state() configSaving = false;
  @state() configApplying = false;
  @state() updateRunning = false;
  @state() applySessionKey = this.settings.lastActiveSessionKey;
  @state() configSnapshot: ConfigSnapshot | null = null;
  @state() configSchema: unknown | null = null;
  @state() configSchemaVersion: string | null = null;
  @state() configSchemaLoading = false;
  @state() configUiHints: ConfigUiHints = {};
  @state() configForm: Record<string, unknown> | null = null;
  @state() configFormOriginal: Record<string, unknown> | null = null;
  @state() configFormDirty = false;
  @state() configFormMode: "form" | "raw" = "form";
  @state() configSearchQuery = "";
  @state() configActiveSection: string | null = null;
  @state() configActiveSubsection: string | null = null;

  @state() channelsLoading = false;
  @state() channelsSnapshot: ChannelsStatusSnapshot | null = null;
  @state() channelsError: string | null = null;
  @state() channelsLastSuccess: number | null = null;
  @state() whatsappLoginMessage: string | null = null;
  @state() whatsappLoginQrDataUrl: string | null = null;
  @state() whatsappLoginConnected: boolean | null = null;
  @state() whatsappBusy = false;
  @state() nostrProfileFormState: NostrProfileFormState | null = null;
  @state() nostrProfileAccountId: string | null = null;

  @state() presenceLoading = false;
  @state() presenceEntries: PresenceEntry[] = [];
  @state() presenceError: string | null = null;
  @state() presenceStatus: string | null = null;

  @state() agentsLoading = false;
  @state() agentsList: AgentsListResult | null = null;
  @state() agentsError: string | null = null;

  @state() sessionsLoading = false;
  @state() sessionsResult: SessionsListResult | null = null;
  @state() sessionsError: string | null = null;
  @state() sessionsFilterActive = "";
  @state() sessionsFilterLimit = "120";
  @state() sessionsIncludeGlobal = true;
  @state() sessionsIncludeUnknown = false;

  @state() cronLoading = false;
  @state() cronJobs: CronJob[] = [];
  @state() cronStatus: CronStatus | null = null;
  @state() cronError: string | null = null;
  @state() cronForm: CronFormState = { ...DEFAULT_CRON_FORM };
  @state() cronRunsJobId: string | null = null;
  @state() cronRuns: CronRunLogEntry[] = [];
  @state() cronBusy = false;

  @state() skillsLoading = false;
  @state() skillsReport: SkillStatusReport | null = null;
  @state() skillsError: string | null = null;
  @state() skillsFilter = "";
  @state() skillEdits: Record<string, string> = {};
  @state() skillsBusyKey: string | null = null;
  @state() skillMessages: Record<string, SkillMessage> = {};
  // Game Code skill 状态
  @state() gameCodeState: import("./views/skills").GameCodeState = {
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

  @state() debugLoading = false;
  @state() debugStatus: StatusSummary | null = null;
  @state() debugHealth: HealthSnapshot | null = null;
  @state() debugModels: unknown[] = [];
  @state() debugHeartbeat: unknown | null = null;
  @state() debugCallMethod = "";
  @state() debugCallParams = "{}";
  @state() debugCallResult: string | null = null;
  @state() debugCallError: string | null = null;

  @state() logsLoading = false;
  @state() logsError: string | null = null;
  @state() logsFile: string | null = null;
  @state() logsEntries: LogEntry[] = [];
  @state() logsFilterText = "";
  @state() logsLevelFilters: Record<LogLevel, boolean> = {
    ...DEFAULT_LOG_LEVEL_FILTERS,
  };
  @state() logsAutoFollow = true;
  @state() logsTruncated = false;
  @state() logsCursor: number | null = null;

  // Agent Models state
  @state() agentModelsData: AgentModelsData = loadAgentModels();
  @state() agentModelsEditingId: string | null = null;
  @state() agentModelsEditForm: Partial<AgentModel> = {};
  @state() agentModelsSaving = false;
  @state() agentModelsSyncing = false;
  @state() agentModelsSyncError: string | null = null;
  @state() agentModelsRestartPending = false;
  @state() logsLastFetchAt: number | null = null;
  @state() logsLimit = 500;
  @state() logsMaxBytes = 250_000;
  @state() logsAtBottom = true;

  client: GatewayBrowserClient | null = null;
  private chatScrollFrame: number | null = null;
  private chatScrollTimeout: number | null = null;
  private chatHasAutoScrolled = false;
  private chatUserNearBottom = true;
  private nodesPollInterval: number | null = null;
  private logsPollInterval: number | null = null;
  private debugPollInterval: number | null = null;
  private logsScrollFrame: number | null = null;
  private toolStreamById = new Map<string, ToolStreamEntry>();
  private toolStreamOrder: string[] = [];
  refreshSessionsAfterChat = false;
  basePath = "";
  private popStateHandler = () =>
    onPopStateInternal(
      this as unknown as Parameters<typeof onPopStateInternal>[0],
    );
  private themeMedia: MediaQueryList | null = null;
  private themeMediaHandler: ((event: MediaQueryListEvent) => void) | null = null;
  private topbarObserver: ResizeObserver | null = null;

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    handleConnected(this as unknown as Parameters<typeof handleConnected>[0]);
  }

  protected firstUpdated() {
    handleFirstUpdated(this as unknown as Parameters<typeof handleFirstUpdated>[0]);
  }

  disconnectedCallback() {
    handleDisconnected(this as unknown as Parameters<typeof handleDisconnected>[0]);
    super.disconnectedCallback();
  }

  protected updated(changed: Map<PropertyKey, unknown>) {
    handleUpdated(
      this as unknown as Parameters<typeof handleUpdated>[0],
      changed,
    );
  }

  connect() {
    connectGatewayInternal(
      this as unknown as Parameters<typeof connectGatewayInternal>[0],
    );
  }

  handleChatScroll(event: Event) {
    handleChatScrollInternal(
      this as unknown as Parameters<typeof handleChatScrollInternal>[0],
      event,
    );
  }

  handleLogsScroll(event: Event) {
    handleLogsScrollInternal(
      this as unknown as Parameters<typeof handleLogsScrollInternal>[0],
      event,
    );
  }

  exportLogs(lines: string[], label: string) {
    exportLogsInternal(lines, label);
  }

  resetToolStream() {
    resetToolStreamInternal(
      this as unknown as Parameters<typeof resetToolStreamInternal>[0],
    );
  }

  resetChatScroll() {
    resetChatScrollInternal(
      this as unknown as Parameters<typeof resetChatScrollInternal>[0],
    );
  }

  async loadAssistantIdentity() {
    await loadAssistantIdentityInternal(this);
  }

  applySettings(next: UiSettings) {
    applySettingsInternal(
      this as unknown as Parameters<typeof applySettingsInternal>[0],
      next,
    );
  }

  setTab(next: Tab) {
    setTabInternal(this as unknown as Parameters<typeof setTabInternal>[0], next);
  }

  setTheme(next: ThemeMode, context?: Parameters<typeof setThemeInternal>[2]) {
    setThemeInternal(
      this as unknown as Parameters<typeof setThemeInternal>[0],
      next,
      context,
    );
  }

  async loadOverview() {
    await loadOverviewInternal(
      this as unknown as Parameters<typeof loadOverviewInternal>[0],
    );
  }

  async loadCron() {
    await loadCronInternal(
      this as unknown as Parameters<typeof loadCronInternal>[0],
    );
  }

  async handleAbortChat() {
    await handleAbortChatInternal(
      this as unknown as Parameters<typeof handleAbortChatInternal>[0],
    );
  }

  removeQueuedMessage(id: string) {
    removeQueuedMessageInternal(
      this as unknown as Parameters<typeof removeQueuedMessageInternal>[0],
      id,
    );
  }

  async handleSendChat(
    messageOverride?: string,
    opts?: Parameters<typeof handleSendChatInternal>[2],
  ) {
    await handleSendChatInternal(
      this as unknown as Parameters<typeof handleSendChatInternal>[0],
      messageOverride,
      opts,
    );
  }

  async handleWhatsAppStart(force: boolean) {
    await handleWhatsAppStartInternal(this, force);
  }

  async handleWhatsAppWait() {
    await handleWhatsAppWaitInternal(this);
  }

  async handleWhatsAppLogout() {
    await handleWhatsAppLogoutInternal(this);
  }

  async handleChannelConfigSave() {
    await handleChannelConfigSaveInternal(this);
  }

  async handleChannelConfigReload() {
    await handleChannelConfigReloadInternal(this);
  }

  handleNostrProfileEdit(accountId: string, profile: NostrProfile | null) {
    handleNostrProfileEditInternal(this, accountId, profile);
  }

  handleNostrProfileCancel() {
    handleNostrProfileCancelInternal(this);
  }

  handleNostrProfileFieldChange(field: keyof NostrProfile, value: string) {
    handleNostrProfileFieldChangeInternal(this, field, value);
  }

  async handleNostrProfileSave() {
    await handleNostrProfileSaveInternal(this);
  }

  async handleNostrProfileImport() {
    await handleNostrProfileImportInternal(this);
  }

  handleNostrProfileToggleAdvanced() {
    handleNostrProfileToggleAdvancedInternal(this);
  }

  async handleExecApprovalDecision(decision: "allow-once" | "allow-always" | "deny") {
    const active = this.execApprovalQueue[0];
    if (!active || !this.client || this.execApprovalBusy) return;
    this.execApprovalBusy = true;
    this.execApprovalError = null;
    try {
      await this.client.request("exec.approval.resolve", {
        id: active.id,
        decision,
      });
      this.execApprovalQueue = this.execApprovalQueue.filter((entry) => entry.id !== active.id);
    } catch (err) {
      this.execApprovalError = `Exec approval failed: ${String(err)}`;
    } finally {
      this.execApprovalBusy = false;
    }
  }

  async handleContentAuditApprovalDecision(decision: "allow" | "block") {
    const active = this.contentAuditApprovalQueue[0];
    if (!active || !this.client || this.contentAuditApprovalBusy) return;
    this.contentAuditApprovalBusy = true;
    this.contentAuditApprovalError = null;
    try {
      await this.client.request("contentAudit.resolve", {
        id: active.id,
        decision,
      });
      this.contentAuditApprovalQueue = this.contentAuditApprovalQueue.filter(
        (entry) => entry.id !== active.id,
      );
    } catch (err) {
      this.contentAuditApprovalError = `Content audit approval failed: ${String(err)}`;
    } finally {
      this.contentAuditApprovalBusy = false;
    }
  }

  handleGatewayUrlConfirm() {
    const nextGatewayUrl = this.pendingGatewayUrl;
    if (!nextGatewayUrl) return;
    this.pendingGatewayUrl = null;
    applySettingsInternal(
      this as unknown as Parameters<typeof applySettingsInternal>[0],
      { ...this.settings, gatewayUrl: nextGatewayUrl },
    );
    this.connect();
  }

  handleGatewayUrlCancel() {
    this.pendingGatewayUrl = null;
  }

  // Sidebar handlers for tool output viewing
  handleOpenSidebar(content: string) {
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
      this.sidebarCloseTimer = null;
    }
    this.sidebarContent = content;
    this.sidebarError = null;
    this.sidebarOpen = true;
  }

  handleCloseSidebar() {
    this.sidebarOpen = false;
    // Clear content after transition
    if (this.sidebarCloseTimer != null) {
      window.clearTimeout(this.sidebarCloseTimer);
    }
    this.sidebarCloseTimer = window.setTimeout(() => {
      if (this.sidebarOpen) return;
      this.sidebarContent = null;
      this.sidebarError = null;
      this.sidebarCloseTimer = null;
    }, 200);
  }

  handleSplitRatioChange(ratio: number) {
    const newRatio = Math.max(0.4, Math.min(0.7, ratio));
    this.splitRatio = newRatio;
    this.applySettings({ ...this.settings, splitRatio: newRatio });
  }

  // Agent Models handlers
  loadAgentModelsData() {
    try {
      let data = loadAgentModels();

      // Create a default model config if none exists
      if (!data.models || data.models.length === 0) {
        const now = Date.now();
        const defaultModel: AgentModel = {
          id: generateModelId(),
          name: "Default Model",
          provider: "openai",
          modelId: "gpt-4",
          apiKey: "",
          baseUrl: "",
          createdAt: now,
          updatedAt: now,
        };

        data = {
          models: [defaultModel],
          activeModelId: defaultModel.id,
        };
        saveAgentModels(data);
      }

      this.agentModelsData = data;
    } catch (err) {
      console.error("Failed to load agent models:", err);
      this.agentModelsData = { models: [], activeModelId: null };
    }
  }

  handleAgentModelAdd() {
    this.agentModelsEditingId = "new";
    this.agentModelsEditForm = {
      name: "",
      provider: "",
      modelId: "",
      apiKey: "",
      baseUrl: "",
    };
  }

  handleAgentModelEdit(modelId: string) {
    const model = this.agentModelsData.models.find((m) => m.id === modelId);
    if (!model) return;
    this.agentModelsEditingId = modelId;
    this.agentModelsEditForm = { ...model };
  }

  handleAgentModelCancelEdit() {
    this.agentModelsEditingId = null;
    this.agentModelsEditForm = {};
  }

  /**
   * Provider 配置映射：定义每个 provider 的默认 baseUrl 和 API 类型
   */
  private static readonly PROVIDER_CONFIG: Record<string, { baseUrl: string; api: string }> = {
    openai: { baseUrl: "https://api.openai.com/v1", api: "openai-completions" },
    anthropic: { baseUrl: "https://api.anthropic.com", api: "anthropic-messages" },
    google: { baseUrl: "https://generativelanguage.googleapis.com/v1beta", api: "google-gemini" },
    deepseek: { baseUrl: "https://api.deepseek.com/v1", api: "openai-completions" },
    moonshot: { baseUrl: "https://api.moonshot.cn/v1", api: "openai-completions" },
    zhipu: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", api: "openai-completions" },
    zai: { baseUrl: "https://open.bigmodel.cn/api/paas/v4", api: "openai-completions" },
    qwen: { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", api: "openai-completions" },
    minimax: { baseUrl: "https://api.minimax.chat/v1", api: "openai-completions" },
    groq: { baseUrl: "https://api.groq.com/openai/v1", api: "openai-completions" },
    xai: { baseUrl: "https://api.x.ai/v1", api: "openai-completions" },
    mistral: { baseUrl: "https://api.mistral.ai/v1", api: "openai-completions" },
    cerebras: { baseUrl: "https://api.cerebras.ai/v1", api: "openai-completions" },
    openrouter: { baseUrl: "https://openrouter.ai/api/v1", api: "openai-completions" },
    ollama: { baseUrl: "http://localhost:11434/v1", api: "openai-completions" },
    azure: { baseUrl: "", api: "azure-openai" }, // Azure 需要用户自定义 baseUrl
    baidu: { baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop", api: "openai-completions" },
    custom: { baseUrl: "", api: "openai-completions" }, // 自定义 provider
  };

  /**
   * 获取 provider 的配置（baseUrl 和 api 类型）
   */
  private getProviderConfig(provider: string, customBaseUrl?: string): { baseUrl: string; api: string } {
    const normalizedProvider = provider.toLowerCase();
    const config = OpenClawApp.PROVIDER_CONFIG[normalizedProvider] || { baseUrl: "", api: "openai-completions" };
    return {
      baseUrl: customBaseUrl?.trim() || config.baseUrl,
      api: config.api,
    };
  }

  /**
   * 同步模型配置到 Gateway（通过 config.patch）
   * 保存后需要重启 Gateway 才能生效
   */
  async syncModelsToGateway(): Promise<boolean> {
    if (!this.client || !this.connected) {
      this.agentModelsSyncError = "未连接到 Gateway";
      return false;
    }

    this.agentModelsSyncing = true;
    this.agentModelsSyncError = null;

    try {
      // 获取当前配置
      const snapshot = await this.client.request<{
        raw?: string;
        hash?: string;
        exists?: boolean;
      }>("config.get", {});

      if (!snapshot || !snapshot.exists) {
        this.agentModelsSyncError = "无法获取当前配置";
        return false;
      }

      // 解析当前配置
      let currentConfig: Record<string, unknown> = {};
      try {
        currentConfig = JSON.parse(snapshot.raw || "{}");
      } catch {
        this.agentModelsSyncError = "配置文件格式错误";
        return false;
      }

      // 获取活动模型
      const activeModel = this.agentModelsData.models.find(
        (m) => m.id === this.agentModelsData.activeModelId
      );

      // 构建所有已配置模型的 providers 配置
      const providers: Record<string, unknown> = {};
      
      // 按 provider 分组处理所有模型
      const modelsByProvider = new Map<string, typeof this.agentModelsData.models>();
      for (const model of this.agentModelsData.models) {
        const providerKey = model.provider.toLowerCase();
        if (!modelsByProvider.has(providerKey)) {
          modelsByProvider.set(providerKey, []);
        }
        modelsByProvider.get(providerKey)!.push(model);
      }

      // 为每个 provider 构建配置
      for (const [providerKey, models] of modelsByProvider) {
        // 使用第一个模型的配置作为 provider 级别配置
        const firstModel = models[0];
        const providerConfig = this.getProviderConfig(providerKey, firstModel.baseUrl);
        
        // 构建 models 数组
        const modelsList = models.map(m => ({
          id: m.modelId,
          name: m.name,
          reasoning: false,
          input: ["text"] as string[],
          contextWindow: 128000,
          maxTokens: 8192,
        }));

        providers[providerKey] = {
          baseUrl: providerConfig.baseUrl,
          api: providerConfig.api,
          // API Key 直接存储在 provider 配置中（最可靠的方式）
          ...(firstModel.apiKey ? { apiKey: firstModel.apiKey } : {}),
          models: modelsList,
        };
      }

      // 构建完整的配置补丁
      const currentAgents = (currentConfig.agents as Record<string, unknown>) || {};
      const currentDefaults = (currentAgents.defaults as Record<string, unknown>) || {};
      
      const patch: Record<string, unknown> = {
        models: {
          providers,
        },
        agents: {
          ...currentAgents,
          defaults: {
            ...currentDefaults,
            // 设置主模型（如果有活动模型）
            ...(activeModel ? {
              model: {
                primary: `${activeModel.provider}/${activeModel.modelId}`,
              },
            } : {}),
          },
        },
      };

      // 调用 config.patch 更新配置并触发重启
      await this.client.request("config.patch", {
        raw: JSON.stringify(patch),
        baseHash: snapshot.hash,
        restartDelayMs: 1000, // 1秒后重启
        note: "模型配置更新",
      });

      this.agentModelsRestartPending = true;
      return true;
    } catch (err) {
      this.agentModelsSyncError = `同步失败: ${String(err)}`;
      return false;
    } finally {
      this.agentModelsSyncing = false;
    }
  }

  async handleAgentModelSave() {
    const { name, provider, modelId, apiKey, baseUrl } = this.agentModelsEditForm;
    if (!name?.trim() || !provider?.trim() || !modelId?.trim()) return;

    this.agentModelsSaving = true;
    const now = Date.now();

    try {
      if (this.agentModelsEditingId === "new") {
        // Add new model
        const newModel: AgentModel = {
          id: generateModelId(),
          name: name.trim(),
          provider: provider.trim(),
          modelId: modelId.trim(),
          apiKey: apiKey?.trim() || "",
          baseUrl: baseUrl?.trim() || "",
          createdAt: now,
          updatedAt: now,
        };
        this.agentModelsData = {
          ...this.agentModelsData,
          models: [...this.agentModelsData.models, newModel],
          activeModelId: this.agentModelsData.activeModelId ?? newModel.id,
        };
      } else {
        // Update existing model
        this.agentModelsData = {
          ...this.agentModelsData,
          models: this.agentModelsData.models.map((m) =>
            m.id === this.agentModelsEditingId
              ? {
                  ...m,
                  name: name.trim(),
                  provider: provider.trim(),
                  modelId: modelId.trim(),
                  apiKey: apiKey?.trim() || "",
                  baseUrl: baseUrl?.trim() || "",
                  updatedAt: now,
                }
              : m,
          ),
        };
      }

      // 保存到 localStorage
      saveAgentModels(this.agentModelsData);
      
      // 同步到 Gateway
      await this.syncModelsToGateway();

      this.agentModelsEditingId = null;
      this.agentModelsEditForm = {};
    } finally {
      this.agentModelsSaving = false;
    }
  }

  async handleAgentModelDelete(modelId: string) {
    const newModels = this.agentModelsData.models.filter((m) => m.id !== modelId);
    const newActiveId =
      this.agentModelsData.activeModelId === modelId
        ? newModels[0]?.id ?? null
        : this.agentModelsData.activeModelId;

    this.agentModelsData = {
      models: newModels,
      activeModelId: newActiveId,
    };
    saveAgentModels(this.agentModelsData);
    
    // 同步到 Gateway
    await this.syncModelsToGateway();
  }

  async handleAgentModelSetActive(modelId: string | null) {
    this.agentModelsData = {
      ...this.agentModelsData,
      activeModelId: modelId,
    };
    saveAgentModels(this.agentModelsData);
    
    // 同步到 Gateway
    await this.syncModelsToGateway();
  }

  handleAgentModelEditFormChange(field: keyof AgentModel, value: string) {
    this.agentModelsEditForm = {
      ...this.agentModelsEditForm,
      [field]: value,
    };
  }

  render() {
    return renderApp(this);
  }
}
