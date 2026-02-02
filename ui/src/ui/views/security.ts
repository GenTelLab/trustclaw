import { html, nothing } from "lit";
import { icons } from "../icons";

type Lang = "zh" | "en";

const i18n = {
  zh: {
    // Content Audit
    contentAuditTitle: "风险审计",
    contentAuditDesc: "实时检测和识别对话中的潜在风险内容",
    enableContentAudit: "启用风险审计",
    enableContentAuditHelp: "启用后，所有消息将通过风险审计服务检查",
    auditApiUrl: "审计接口URL",
    auditApiUrlPlaceholder: "http://your-audit-api.com/api/token/deduct",
    auditApiUrlHelp: "风险审计服务的API端点",
    auditApiToken: "审计接口Token",
    auditApiTokenPlaceholder: "sk-xxx",
    auditApiTokenHelp: "用于身份验证的API密钥",
    auditTimeout: "超时时间 (毫秒)",
    auditTimeoutHelp: "风险审计的最大等待时间",
    labelPoliciesTitle: "风险管控策略",
    labelPoliciesDesc: "配置不同风险类型的响应策略",
    labelNormal: "合规内容",
    labelPorn: "色情内容",
    labelPolitics: "政治内容",
    labelViolence: "恐暴内容",
    labelIllegal: "违禁内容",
    labelDiscrimination: "歧视内容",
    labelUnethical: "不良内容",
    labelInjection: "注入攻击检测",
    labelPrivilege: "越权行为监控",
    labelPrivacy: "隐私信息加密",
    labelBehavior: "行为合理性分析",
    labelHallucination: "模型幻觉检测",
    comingSoon: "敬请期待",
    actionAllow: "放行",
    actionConfirm: "确认",
    actionBlock: "阻止",
    riskLow: "低风险",
    riskMedium: "中风险",
    riskHigh: "高风险",
    riskCritical: "严重",

    botSecurityTitle: "Bot安全开关",
    botSecurityDesc: "控制Bot的安全行为和隔离策略",
    sandboxMode: "沙箱模式",
    sandboxModeHelp: "在Docker容器中隔离运行工具，提高安全性",
    redactSensitive: "日志敏感信息脱敏",
    redactSensitiveHelp: "自动隐藏日志中的敏感数据（密码、Token等）",
    toolConfirmation: "工具执行确认",
    toolConfirmationHelp: "执行高风险操作前需要用户确认",
    networkIsolation: "网络隔离模式",
    networkIsolationHelp: "限制Agent的网络访问范围",
    fileSystemRestrict: "文件系统限制",
    fileSystemRestrictHelp: "限制Agent只能访问指定目录",
    auditLogging: "审计日志",
    auditLoggingHelp: "记录所有操作用于合规审计",
    rateLimit: "速率限制",
    rateLimitHelp: "限制API调用频率，防止滥用",

    advancedTitle: "高级安全设置",
    advancedDesc: "更细粒度的安全控制选项",
    compactionMode: "压缩模式",
    compactionModeHelp: "上下文压缩时的安全检查模式",
    compactionDefault: "默认",
    compactionSafeguard: "安全保护",
    thinkingLevel: "思考级别",
    thinkingLevelHelp: "Agent思考过程的详细程度",
    thinkingLow: "低",
    thinkingMedium: "中",
    thinkingHigh: "高",

    saveConfig: "保存配置",
    saving: "保存中...",
  },
  en: {
    // Content Audit
    contentAuditTitle: "Content Security Audit",
    contentAuditDesc: "Audit message content for policy violations",
    enableContentAudit: "Enable Content Audit",
    enableContentAuditHelp: "When enabled, all messages will be checked by content audit service",
    auditApiUrl: "Audit API URL",
    auditApiUrlPlaceholder: "http://your-audit-api.com/api/token/deduct",
    auditApiUrlHelp: "API endpoint for content audit service",
    auditApiToken: "Audit API Token",
    auditApiTokenPlaceholder: "sk-xxx",
    auditApiTokenHelp: "API key for authentication",
    auditTimeout: "Timeout (ms)",
    auditTimeoutHelp: "Maximum wait time for content audit",
    labelPoliciesTitle: "Content Label Policies",
    labelPoliciesDesc: "Configure handling policies for different content labels",
    labelNormal: "Normal",
    labelPorn: "Pornographic",
    labelPolitics: "Political",
    labelViolence: "Violence",
    labelIllegal: "Illegal",
    labelDiscrimination: "Discrimination",
    labelUnethical: "Unethical",
    labelInjection: "Injection Attack Detection",
    labelPrivilege: "Privilege Escalation Monitor",
    labelPrivacy: "Privacy Data Encryption",
    labelBehavior: "Behavior Rationality Analysis",
    labelHallucination: "Model Hallucination Detection",
    comingSoon: "Coming Soon",
    actionAllow: "Allow",
    actionConfirm: "Confirm",
    actionBlock: "Block",
    riskLow: "Low",
    riskMedium: "Medium",
    riskHigh: "High",
    riskCritical: "Critical",

    botSecurityTitle: "Bot Security Switches",
    botSecurityDesc: "Control Bot security behavior and isolation policies",
    sandboxMode: "Sandbox Mode",
    sandboxModeHelp: "Run tools in isolated Docker containers for enhanced security",
    redactSensitive: "Redact Sensitive Logs",
    redactSensitiveHelp: "Automatically hide sensitive data in logs (passwords, tokens, etc.)",
    toolConfirmation: "Tool Execution Confirmation",
    toolConfirmationHelp: "Require user confirmation before executing high-risk operations",
    networkIsolation: "Network Isolation Mode",
    networkIsolationHelp: "Restrict Agent's network access scope",
    fileSystemRestrict: "File System Restriction",
    fileSystemRestrictHelp: "Restrict Agent to access only specified directories",
    auditLogging: "Audit Logging",
    auditLoggingHelp: "Record all operations for compliance auditing",
    rateLimit: "Rate Limiting",
    rateLimitHelp: "Limit API call frequency to prevent abuse",

    advancedTitle: "Advanced Security Settings",
    advancedDesc: "Fine-grained security control options",
    compactionMode: "Compaction Mode",
    compactionModeHelp: "Security check mode during context compaction",
    compactionDefault: "Default",
    compactionSafeguard: "Safeguard",
    thinkingLevel: "Thinking Level",
    thinkingLevelHelp: "Detail level of Agent's thinking process",
    thinkingLow: "Low",
    thinkingMedium: "Medium",
    thinkingHigh: "High",

    saveConfig: "Save Configuration",
    saving: "Saving...",
  },
};

type ContentLabelAction = "allow" | "confirm" | "block";

type ContentLabelPolicy = {
  action: ContentLabelAction;
};

export type SecurityProps = {
  connected: boolean;
  lang: Lang;
  config: {
    security?: {
      contentAudit?: {
        enabled?: boolean;
        baseUrl?: string;
        token?: string;
        timeoutMs?: number;
        labelConfigs?: {
          normal?: ContentLabelPolicy;
          porn?: ContentLabelPolicy;
          politics?: ContentLabelPolicy;
          violence?: ContentLabelPolicy;
          illegal?: ContentLabelPolicy;
          discrimination?: ContentLabelPolicy;
          unethical?: ContentLabelPolicy;
        };
      };
      toolConfirmation?: boolean;
      networkIsolation?: boolean;
      fileSystemRestrict?: boolean;
      auditLogging?: boolean;
      rateLimit?: boolean;
    };
    agents?: {
      defaults?: {
        sandbox?: {
          mode?: string;
        };
        compaction?: {
          mode?: string;
        };
        thinkingDefault?: string;
      };
    };
    logging?: {
      redactSensitive?: string;
    };
  };
  onConfigChange: (path: string, value: unknown) => void;
  onConfigSave: () => Promise<void>;
  saving: boolean;
};

// Default label policies
const DEFAULT_LABEL_POLICIES: Record<string, { action: ContentLabelAction; risk: string }> = {
  normal: { action: "allow", risk: "low" },
  porn: { action: "block", risk: "critical" },
  politics: { action: "confirm", risk: "high" },
  violence: { action: "block", risk: "critical" },
  illegal: { action: "block", risk: "critical" },
  discrimination: { action: "confirm", risk: "high" },
  unethical: { action: "confirm", risk: "medium" },
};

// Render a disabled "coming soon" row
function renderDisabledLabelPolicyRow(
  t: (typeof i18n)["zh"],
  labelName: string,
) {
  return html`
    <div class="label-policy-row label-policy-row--disabled">
      <div class="label-policy-row__info">
        <span class="label-policy-row__name label-policy-row__name--disabled">${labelName}</span>
        <span class="badge badge--muted">${t.comingSoon}</span>
      </div>
      <div class="cfg-segmented cfg-segmented--sm">
        <button type="button" class="cfg-segmented__btn" disabled>${t.actionAllow}</button>
        <button type="button" class="cfg-segmented__btn" disabled>${t.actionConfirm}</button>
        <button type="button" class="cfg-segmented__btn" disabled>${t.actionBlock}</button>
      </div>
    </div>
  `;
}

function renderLabelPolicyRow(
  props: SecurityProps,
  t: (typeof i18n)["zh"],
  labelKey: string,
  labelName: string,
  defaultPolicy: { action: ContentLabelAction; risk: string },
) {
  const contentAudit = props.config?.security?.contentAudit || {};
  const labelConfigs = contentAudit.labelConfigs || {};
  const currentAction =
    (labelConfigs as Record<string, ContentLabelPolicy | undefined>)[labelKey]?.action ||
    defaultPolicy.action;

  const riskBadgeClass =
    defaultPolicy.risk === "critical"
      ? "badge--danger"
      : defaultPolicy.risk === "high"
        ? "badge--warning"
        : defaultPolicy.risk === "medium"
          ? "badge--info"
          : "";

  const riskText =
    defaultPolicy.risk === "critical"
      ? t.riskCritical
      : defaultPolicy.risk === "high"
        ? t.riskHigh
        : defaultPolicy.risk === "medium"
          ? t.riskMedium
          : t.riskLow;

  return html`
    <div class="label-policy-row">
      <div class="label-policy-row__info">
        <span class="label-policy-row__name">${labelName}</span>
        <span class="badge ${riskBadgeClass}">${riskText}</span>
      </div>
      <div class="cfg-segmented cfg-segmented--sm">
        <button
          type="button"
          class="cfg-segmented__btn ${currentAction === "allow" ? "active" : ""}"
          ?disabled=${!props.connected}
          @click=${() =>
            props.onConfigChange(`security.contentAudit.labelConfigs.${labelKey}.action`, "allow")}
        >
          ${t.actionAllow}
        </button>
        <button
          type="button"
          class="cfg-segmented__btn ${currentAction === "confirm" ? "active" : ""}"
          ?disabled=${!props.connected}
          @click=${() =>
            props.onConfigChange(`security.contentAudit.labelConfigs.${labelKey}.action`, "confirm")}
        >
          ${t.actionConfirm}
        </button>
        <button
          type="button"
          class="cfg-segmented__btn ${currentAction === "block" ? "active" : ""}"
          ?disabled=${!props.connected}
          @click=${() =>
            props.onConfigChange(`security.contentAudit.labelConfigs.${labelKey}.action`, "block")}
        >
          ${t.actionBlock}
        </button>
      </div>
    </div>
  `;
}

export function renderSecurity(props: SecurityProps) {
  const t = i18n[props.lang] || i18n.zh;
  const contentAudit = props.config?.security?.contentAudit || {};
  const security = props.config?.security || {};
  const agentDefaults = props.config?.agents?.defaults || {};
  const sandboxMode = agentDefaults.sandbox?.mode || "off";
  const compactionMode = agentDefaults.compaction?.mode || "default";
  const thinkingLevel = agentDefaults.thinkingDefault || "medium";
  const redactSensitive = props.config?.logging?.redactSensitive || "tools";

  return html`
    <div class="config-form--modern">
      <!-- Content Audit Card -->
      <div class="config-section-card">
        <div class="config-section-card__header">
          <div class="config-section-card__icon">${icons.shield}</div>
          <div class="config-section-card__titles">
            <h3 class="config-section-card__title">${t.contentAuditTitle}</h3>
            <p class="config-section-card__desc">${t.contentAuditDesc}</p>
          </div>
        </div>
        <div class="config-section-card__content">
          <div class="cfg-fields">
            <!-- Enable Toggle -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.enableContentAudit}</span>
                <span class="cfg-toggle-row__help">${t.enableContentAuditHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${contentAudit.enabled === true}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange(
                      "security.contentAudit.enabled",
                      (e.target as HTMLInputElement).checked,
                    );
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- API URL -->
            <div class="cfg-field">
              <label class="cfg-field__label">${t.auditApiUrl}</label>
              <span class="cfg-field__help">${t.auditApiUrlHelp}</span>
              <div class="cfg-input-wrap">
                <input
                  type="text"
                  class="cfg-input"
                  placeholder="${t.auditApiUrlPlaceholder}"
                  .value=${contentAudit.baseUrl || ""}
                  ?disabled=${!props.connected}
                  @input=${(e: Event) => {
                    props.onConfigChange(
                      "security.contentAudit.baseUrl",
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                />
              </div>
            </div>

            <!-- Token -->
            <div class="cfg-field">
              <label class="cfg-field__label">${t.auditApiToken}</label>
              <span class="cfg-field__help">${t.auditApiTokenHelp}</span>
              <div class="cfg-input-wrap">
                <input
                  type="password"
                  class="cfg-input"
                  placeholder="${t.auditApiTokenPlaceholder}"
                  .value=${contentAudit.token || ""}
                  ?disabled=${!props.connected}
                  @input=${(e: Event) => {
                    props.onConfigChange(
                      "security.contentAudit.token",
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                />
              </div>
            </div>

            <!-- Timeout -->
            <div class="cfg-field">
              <label class="cfg-field__label">${t.auditTimeout}</label>
              <span class="cfg-field__help">${t.auditTimeoutHelp}</span>
              <div class="cfg-number">
                <button
                  class="cfg-number__btn"
                  type="button"
                  ?disabled=${!props.connected}
                  @click=${() => {
                    const current = contentAudit.timeoutMs || 5000;
                    if (current > 1000) {
                      props.onConfigChange("security.contentAudit.timeoutMs", current - 1000);
                    }
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  class="cfg-number__input"
                  min="1000"
                  max="30000"
                  step="1000"
                  .value=${String(contentAudit.timeoutMs || 5000)}
                  ?disabled=${!props.connected}
                  @input=${(e: Event) => {
                    props.onConfigChange(
                      "security.contentAudit.timeoutMs",
                      parseInt((e.target as HTMLInputElement).value, 10) || 5000,
                    );
                  }}
                />
                <button
                  class="cfg-number__btn"
                  type="button"
                  ?disabled=${!props.connected}
                  @click=${() => {
                    const current = contentAudit.timeoutMs || 5000;
                    if (current < 30000) {
                      props.onConfigChange("security.contentAudit.timeoutMs", current + 1000);
                    }
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Label Policies Card -->
      <div class="config-section-card">
        <div class="config-section-card__header">
          <div class="config-section-card__icon">${icons.settings}</div>
          <div class="config-section-card__titles">
            <h3 class="config-section-card__title">${t.labelPoliciesTitle}</h3>
            <p class="config-section-card__desc">${t.labelPoliciesDesc}</p>
          </div>
        </div>
        <div class="config-section-card__content">
          <div class="label-policies">
            ${renderLabelPolicyRow(props, t, "normal", t.labelNormal, DEFAULT_LABEL_POLICIES.normal)}
            ${renderLabelPolicyRow(props, t, "porn", t.labelPorn, DEFAULT_LABEL_POLICIES.porn)}
            ${renderLabelPolicyRow(props, t, "politics", t.labelPolitics, DEFAULT_LABEL_POLICIES.politics)}
            ${renderLabelPolicyRow(props, t, "violence", t.labelViolence, DEFAULT_LABEL_POLICIES.violence)}
            ${renderLabelPolicyRow(props, t, "illegal", t.labelIllegal, DEFAULT_LABEL_POLICIES.illegal)}
            ${renderLabelPolicyRow(props, t, "discrimination", t.labelDiscrimination, DEFAULT_LABEL_POLICIES.discrimination)}
            ${renderLabelPolicyRow(props, t, "unethical", t.labelUnethical, DEFAULT_LABEL_POLICIES.unethical)}
            ${renderDisabledLabelPolicyRow(t, t.labelInjection)}
            ${renderDisabledLabelPolicyRow(t, t.labelPrivilege)}
            ${renderDisabledLabelPolicyRow(t, t.labelPrivacy)}
            ${renderDisabledLabelPolicyRow(t, t.labelBehavior)}
            ${renderDisabledLabelPolicyRow(t, t.labelHallucination)}
          </div>
        </div>
      </div>

      <!-- Bot Security Switches Card -->
      <div class="config-section-card">
        <div class="config-section-card__header">
          <div class="config-section-card__icon">${icons.lock}</div>
          <div class="config-section-card__titles">
            <h3 class="config-section-card__title">${t.botSecurityTitle}</h3>
            <p class="config-section-card__desc">${t.botSecurityDesc}</p>
          </div>
        </div>
        <div class="config-section-card__content">
          <div class="cfg-fields">
            <!-- Sandbox Mode -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.sandboxMode}</span>
                <span class="cfg-toggle-row__help">${t.sandboxModeHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${sandboxMode !== "off"}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("agents.defaults.sandbox.mode", (e.target as HTMLInputElement).checked ? "all" : "off");
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- Redact Sensitive -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.redactSensitive}</span>
                <span class="cfg-toggle-row__help">${t.redactSensitiveHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${redactSensitive !== "off"}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("logging.redactSensitive", (e.target as HTMLInputElement).checked ? "tools" : "off");
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- Tool Confirmation -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.toolConfirmation}</span>
                <span class="cfg-toggle-row__help">${t.toolConfirmationHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${security.toolConfirmation !== false}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("security.toolConfirmation", (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- Network Isolation -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.networkIsolation}</span>
                <span class="cfg-toggle-row__help">${t.networkIsolationHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${security.networkIsolation === true}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("security.networkIsolation", (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- File System Restriction -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.fileSystemRestrict}</span>
                <span class="cfg-toggle-row__help">${t.fileSystemRestrictHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${security.fileSystemRestrict === true}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("security.fileSystemRestrict", (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- Audit Logging -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.auditLogging}</span>
                <span class="cfg-toggle-row__help">${t.auditLoggingHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${security.auditLogging !== false}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("security.auditLogging", (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>

            <!-- Rate Limit -->
            <label class="cfg-toggle-row ${!props.connected ? "disabled" : ""}">
              <div class="cfg-toggle-row__content">
                <span class="cfg-toggle-row__label">${t.rateLimit}</span>
                <span class="cfg-toggle-row__help">${t.rateLimitHelp}</span>
              </div>
              <div class="cfg-toggle">
                <input
                  type="checkbox"
                  ?checked=${security.rateLimit === true}
                  ?disabled=${!props.connected}
                  @change=${(e: Event) => {
                    props.onConfigChange("security.rateLimit", (e.target as HTMLInputElement).checked);
                  }}
                />
                <span class="cfg-toggle__track"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Advanced Security Card -->
      <div class="config-section-card">
        <div class="config-section-card__header">
          <div class="config-section-card__icon">${icons.settings}</div>
          <div class="config-section-card__titles">
            <h3 class="config-section-card__title">${t.advancedTitle}</h3>
            <p class="config-section-card__desc">${t.advancedDesc}</p>
          </div>
        </div>
        <div class="config-section-card__content">
          <div class="cfg-fields">
            <!-- Compaction Mode -->
            <div class="cfg-field">
              <label class="cfg-field__label">${t.compactionMode}</label>
              <span class="cfg-field__help">${t.compactionModeHelp}</span>
              <div class="cfg-segmented">
                <button
                  type="button"
                  class="cfg-segmented__btn ${compactionMode === "default" ? "active" : ""}"
                  ?disabled=${!props.connected}
                  @click=${() => props.onConfigChange("agents.defaults.compaction.mode", "default")}
                >${t.compactionDefault}</button>
                <button
                  type="button"
                  class="cfg-segmented__btn ${compactionMode === "safeguard" ? "active" : ""}"
                  ?disabled=${!props.connected}
                  @click=${() => props.onConfigChange("agents.defaults.compaction.mode", "safeguard")}
                >${t.compactionSafeguard}</button>
              </div>
            </div>

            <!-- Thinking Level -->
            <div class="cfg-field">
              <label class="cfg-field__label">${t.thinkingLevel}</label>
              <span class="cfg-field__help">${t.thinkingLevelHelp}</span>
              <div class="cfg-segmented">
                <button
                  type="button"
                  class="cfg-segmented__btn ${thinkingLevel === "low" ? "active" : ""}"
                  ?disabled=${!props.connected}
                  @click=${() => props.onConfigChange("agents.defaults.thinkingDefault", "low")}
                >${t.thinkingLow}</button>
                <button
                  type="button"
                  class="cfg-segmented__btn ${thinkingLevel === "medium" ? "active" : ""}"
                  ?disabled=${!props.connected}
                  @click=${() => props.onConfigChange("agents.defaults.thinkingDefault", "medium")}
                >${t.thinkingMedium}</button>
                <button
                  type="button"
                  class="cfg-segmented__btn ${thinkingLevel === "high" ? "active" : ""}"
                  ?disabled=${!props.connected}
                  @click=${() => props.onConfigChange("agents.defaults.thinkingDefault", "high")}
                >${t.thinkingHigh}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div style="display: flex; justify-content: flex-end; padding-top: 8px;">
        <button
          class="btn primary"
          ?disabled=${!props.connected || props.saving}
          @click=${() => props.onConfigSave()}
        >
          ${props.saving ? t.saving : t.saveConfig}
        </button>
      </div>
    </div>
  `;
}
