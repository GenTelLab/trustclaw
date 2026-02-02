import type { OpenClawConfig } from "../config/config.js";
import { loadConfig } from "../config/config.js";

export type SecurityRiskLevel = "pass" | "low" | "medium" | "high";

export type SecurityCheckRequest = {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
  sessionKey?: string;
  timestamp: number;
};

export type SecurityCheckResponse = {
  riskLevel: SecurityRiskLevel;
  reason?: string;
  tags?: string[];
};

export type SecurityCheckResult = {
  riskLevel: SecurityRiskLevel;
  reason?: string;
  tags?: string[];
  error?: string;
};

export class SecurityGateway {
  private config: OpenClawConfig;
  private baseUrl?: string;
  private token?: string;
  private timeoutMs: number;
  private enabled: boolean;

  constructor(config?: OpenClawConfig) {
    this.config = config ?? loadConfig();
    const gatewayConfig = this.config.security?.gateway;
    this.enabled = gatewayConfig?.enabled !== false;
    this.baseUrl = gatewayConfig?.baseUrl?.trim();
    this.token = gatewayConfig?.token?.trim();
    this.timeoutMs = gatewayConfig?.timeoutMs ?? 5000;
  }

  /**
   * 检查LLM返回内容的安全性
   */
  async checkSecurity(
    content: string,
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>,
    sessionKey?: string,
  ): Promise<SecurityCheckResult> {
    // 如果未启用或未配置，默认通过
    if (!this.enabled || !this.baseUrl) {
      return { riskLevel: "pass" };
    }

    const request: SecurityCheckRequest = {
      content,
      toolCalls,
      sessionKey,
      timestamp: Date.now(),
    };

    try {
      const response = await this.callSecurityAPI(request);
      return {
        riskLevel: response.riskLevel,
        reason: response.reason,
        tags: response.tags,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // 安全接口失败时的降级策略：默认拒绝（更安全）
      return {
        riskLevel: "high",
        reason: `安全接口调用失败: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * 检查工具调用的安全性
   */
  async checkToolCall(
    toolName: string,
    toolArguments: Record<string, unknown>,
    sessionKey?: string,
  ): Promise<SecurityCheckResult> {
    return this.checkSecurity(
      `工具调用: ${toolName}`,
      [{ name: toolName, arguments: toolArguments }],
      sessionKey,
    );
  }

  /**
   * 调用外部安全接口
   */
  private async callSecurityAPI(request: SecurityCheckRequest): Promise<SecurityCheckResponse> {
    if (!this.baseUrl) {
      throw new Error("安全接口URL未配置");
    }

    const url = this.baseUrl.endsWith("/") ? `${this.baseUrl}check` : `${this.baseUrl}/check`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${text || "未知错误"}`);
      }

      const data = (await response.json()) as SecurityCheckResponse;

      // 验证响应格式
      if (!data.riskLevel || !["pass", "low", "medium", "high"].includes(data.riskLevel)) {
        throw new Error("安全接口返回格式无效: riskLevel必须是 pass|low|medium|high");
      }

      return data;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`安全接口调用超时 (${this.timeoutMs}ms)`);
      }
      throw err;
    }
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.enabled && Boolean(this.baseUrl);
  }
}

/**
 * 创建安全网关实例
 */
export function createSecurityGateway(config?: OpenClawConfig): SecurityGateway {
  return new SecurityGateway(config);
}
