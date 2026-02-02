/**
 * Content Audit Service
 *
 * Integrates with external content moderation API to check message content
 * for policy violations before processing.
 */

import type { PinoLikeLogger } from "../logging.js";

/**
 * Content labels returned by the audit API
 */
export type ContentLabel =
  | "normal" // 合规内容
  | "porn" // 色情内容
  | "politics" // 政治内容
  | "violence" // 恐暴内容
  | "illegal" // 违禁内容
  | "discrimination" // 歧视内容
  | "unethical"; // 不良内容

/**
 * Risk level for content labels
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Action to take for content
 */
export type ContentAction = "allow" | "confirm" | "block";

/**
 * Content label configuration
 */
export type ContentLabelConfig = {
  label: ContentLabel;
  riskLevel: RiskLevel;
  action: ContentAction;
  description: string;
  descriptionZh: string;
};

/**
 * Default label configurations
 */
export const DEFAULT_LABEL_CONFIGS: ContentLabelConfig[] = [
  {
    label: "normal",
    riskLevel: "low",
    action: "allow",
    description: "Compliant content",
    descriptionZh: "合规内容",
  },
  {
    label: "porn",
    riskLevel: "critical",
    action: "block",
    description: "Pornographic content",
    descriptionZh: "色情内容",
  },
  {
    label: "politics",
    riskLevel: "high",
    action: "confirm",
    description: "Political content",
    descriptionZh: "政治内容",
  },
  {
    label: "violence",
    riskLevel: "critical",
    action: "block",
    description: "Violent/terrorist content",
    descriptionZh: "恐暴内容",
  },
  {
    label: "illegal",
    riskLevel: "critical",
    action: "block",
    description: "Prohibited content",
    descriptionZh: "违禁内容",
  },
  {
    label: "discrimination",
    riskLevel: "high",
    action: "confirm",
    description: "Discriminatory content",
    descriptionZh: "歧视内容",
  },
  {
    label: "unethical",
    riskLevel: "medium",
    action: "confirm",
    description: "Unethical content",
    descriptionZh: "不良内容",
  },
];

/**
 * Single text audit result from API
 */
export type TextAuditResult = {
  text: string;
  mainLabel: ContentLabel;
  mainConfidence: number;
};

/**
 * API response structure
 */
export type ContentAuditApiResponse = {
  code: number;
  message: string;
  data: {
    token: string;
    success: boolean;
    deductAmount: number;
    balanceBefore: number;
    balanceAfter: number;
    requestId: string;
    processTime: string;
    idempotentHit: boolean;
    data: TextAuditResult[];
  };
  requestId: string;
  timestamp: string;
};

/**
 * Content audit result
 */
export type ContentAuditResult = {
  success: boolean;
  label: ContentLabel;
  confidence: number;
  riskLevel: RiskLevel;
  action: ContentAction;
  description: string;
  requestId?: string;
  error?: string;
};

// Re-export ContentAuditConfig from types
import type { ContentAuditConfig } from "../config/types.security.js";
export type { ContentAuditConfig };

/**
 * Content Audit Service
 */
export class ContentAuditService {
  private config: ContentAuditConfig;
  private labelConfigs: Map<ContentLabel, ContentLabelConfig>;
  private log?: PinoLikeLogger;

  constructor(config: ContentAuditConfig, log?: PinoLikeLogger) {
    this.config = config;
    this.log = log;
    this.labelConfigs = new Map();

    // Initialize with default configs
    for (const cfg of DEFAULT_LABEL_CONFIGS) {
      this.labelConfigs.set(cfg.label, { ...cfg });
    }

    // Apply custom action overrides
    if (config.labelConfigs) {
      for (const [label, override] of Object.entries(config.labelConfigs)) {
        const existing = this.labelConfigs.get(label as ContentLabel);
        if (existing && override?.action) {
          existing.action = override.action as ContentAction;
        }
      }
    }
  }

  /**
   * Check if audit is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled === true && !!this.config.baseUrl && !!this.config.token;
  }

  /**
   * Audit a single text
   */
  async auditText(text: string): Promise<ContentAuditResult> {
    const results = await this.auditTexts([text]);
    return results[0];
  }

  /**
   * Audit multiple texts
   */
  async auditTexts(texts: string[]): Promise<ContentAuditResult[]> {
    if (!this.isEnabled()) {
      // Return allow for all if not enabled
      return texts.map(() => ({
        success: true,
        label: "normal" as ContentLabel,
        confidence: 1.0,
        riskLevel: "low" as RiskLevel,
        action: "allow" as ContentAction,
        description: "Audit disabled",
      }));
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 5000);

      const response = await fetch(this.config.baseUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: this.config.token,
          texts,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ContentAuditApiResponse = await response.json();

      if (data.code !== 200 || !data.data?.success) {
        throw new Error(data.message || "Audit API error");
      }

      return data.data.data.map((result) => {
        const labelConfig = this.labelConfigs.get(result.mainLabel) || {
          label: result.mainLabel,
          riskLevel: "medium" as RiskLevel,
          action: "confirm" as ContentAction,
          description: result.mainLabel,
          descriptionZh: result.mainLabel,
        };

        return {
          success: true,
          label: result.mainLabel,
          confidence: result.mainConfidence,
          riskLevel: labelConfig.riskLevel,
          action: labelConfig.action,
          description: labelConfig.descriptionZh,
          requestId: data.requestId,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log?.warn(`Content audit failed: ${errorMessage}`);

      // On error, default to allow (fail-open) or block (fail-close) based on config
      return texts.map(() => ({
        success: false,
        label: "normal" as ContentLabel,
        confidence: 0,
        riskLevel: "low" as RiskLevel,
        action: "allow" as ContentAction,
        description: "Audit failed",
        error: errorMessage,
      }));
    }
  }

  /**
   * Get label configuration
   */
  getLabelConfig(label: ContentLabel): ContentLabelConfig | undefined {
    return this.labelConfigs.get(label);
  }

  /**
   * Update label action
   */
  setLabelAction(label: ContentLabel, action: ContentAction): void {
    const config = this.labelConfigs.get(label);
    if (config) {
      config.action = action;
    }
  }
}

/**
 * Create a content audit service from config
 */
export function createContentAuditService(
  config: {
    security?: {
      contentAudit?: ContentAuditConfig;
    };
  },
  log?: PinoLikeLogger,
): ContentAuditService | null {
  const auditConfig = config.security?.contentAudit;
  if (!auditConfig?.enabled) {
    return null;
  }

  return new ContentAuditService(auditConfig, log);
}

/**
 * Format audit result for display
 */
export function formatAuditResult(result: ContentAuditResult, lang: "zh" | "en" = "zh"): string {
  if (!result.success) {
    return lang === "zh" ? `审计失败: ${result.error}` : `Audit failed: ${result.error}`;
  }

  const actionText =
    lang === "zh"
      ? { allow: "放行", confirm: "需确认", block: "已阻止" }
      : { allow: "Allowed", confirm: "Needs confirmation", block: "Blocked" };

  return `[${result.description}] ${actionText[result.action]}`;
}
