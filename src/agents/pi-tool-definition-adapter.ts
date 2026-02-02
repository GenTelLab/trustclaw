import type {
  AgentTool,
  AgentToolResult,
  AgentToolUpdateCallback,
} from "@mariozechner/pi-agent-core";
import type { ToolDefinition } from "@mariozechner/pi-coding-agent";
import type { ClientToolDefinition } from "./pi-embedded-runner/run/params.js";
import { logDebug, logError, logInfo, logWarn } from "../logger.js";
import { normalizeToolName } from "./tool-policy.js";
import { jsonResult } from "./tools/common.js";
import { loadConfig } from "../config/config.js";
import { ContentAuditService, type ContentAuditConfig } from "../security/content-audit.js";
import { broadcastGatewayEvent } from "../infra/agent-events.js";

// Content audit service instance (lazily initialized)
let contentAuditService: ContentAuditService | null = null;
let lastAuditConfigHash: string | null = null;

function hashAuditConfig(cfg: ContentAuditConfig | undefined): string {
  if (!cfg) return "";
  const labelConfigsHash = cfg.labelConfigs ? JSON.stringify(cfg.labelConfigs) : "";
  return `${cfg.enabled}|${cfg.baseUrl}|${cfg.token}|${cfg.timeoutMs}|${labelConfigsHash}`;
}

function getContentAuditService(cfg: { security?: { contentAudit?: ContentAuditConfig } }): ContentAuditService | null {
  const auditConfig = cfg.security?.contentAudit;
  if (!auditConfig?.enabled || !auditConfig.baseUrl || !auditConfig.token) {
    contentAuditService = null;
    lastAuditConfigHash = null;
    return null;
  }
  
  const currentHash = hashAuditConfig(auditConfig);
  if (!contentAuditService || lastAuditConfigHash !== currentHash) {
    contentAuditService = new ContentAuditService(auditConfig);
    lastAuditConfigHash = currentHash;
  }
  return contentAuditService;
}

// Pending content audit approval tracking for tool execution
const pendingToolAuditApprovals = new Map<string, {
  resolve: (decision: "allow" | "block" | null) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}>();

export function resolveToolAuditApproval(approvalId: string, decision: "allow" | "block"): boolean {
  const pending = pendingToolAuditApprovals.get(approvalId);
  if (!pending) return false;
  clearTimeout(pending.timeoutId);
  pendingToolAuditApprovals.delete(approvalId);
  pending.resolve(decision);
  return true;
}

async function waitForToolAuditApproval(
  approvalId: string,
  timeoutMs: number,
): Promise<"allow" | "block" | null> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      pendingToolAuditApprovals.delete(approvalId);
      resolve(null); // timeout
    }, timeoutMs);
    pendingToolAuditApprovals.set(approvalId, { resolve, timeoutId });
  });
}

// Track blocked tool calls to avoid duplicate prompts after rejection
// Only tracks blocked decisions - each tool call is audited independently
const blockedToolCalls = new Map<string, number>();

// Clean up old entries periodically (5 min TTL)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of blockedToolCalls) {
    if (now - timestamp > 300_000) {
      blockedToolCalls.delete(key);
    }
  }
}, 60_000);

// biome-ignore lint/suspicious/noExplicitAny: TypeBox schema type from pi-agent-core uses a different module instance.
type AnyAgentTool = AgentTool<any, unknown>;

function describeToolExecutionError(err: unknown): {
  message: string;
  stack?: string;
} {
  if (err instanceof Error) {
    const message = err.message?.trim() ? err.message : String(err);
    return { message, stack: err.stack };
  }
  return { message: String(err) };
}

export type ToToolDefinitionsOptions = {
  /** Skip content audit for these tools (e.g., for webchat where user already sees AI response) */
  skipContentAudit?: boolean;
};

export function toToolDefinitions(tools: AnyAgentTool[], options?: ToToolDefinitionsOptions): ToolDefinition[] {
  const skipContentAudit = options?.skipContentAudit ?? false;
  
  return tools.map((tool) => {
    const name = tool.name || "tool";
    const normalizedName = normalizeToolName(name);
    return {
      name,
      label: tool.label ?? name,
      description: tool.description ?? "",
      // biome-ignore lint/suspicious/noExplicitAny: TypeBox schema from pi-agent-core uses a different module instance.
      parameters: tool.parameters as any,
      execute: async (
        toolCallId,
        params,
        onUpdate: AgentToolUpdateCallback<unknown> | undefined,
        _ctx,
        signal,
      ): Promise<AgentToolResult<unknown>> => {
        // KNOWN: pi-coding-agent `ToolDefinition.execute` has a different signature/order
        // than pi-agent-core `AgentTool.execute`. This adapter keeps our existing tools intact.

        // Content audit check BEFORE tool execution
        // Skip for webchat (user already sees AI response in chat panel)
        const config = loadConfig();
        const auditService = getContentAuditService(config);
        logInfo(`[ContentAudit] 工具调用检查: tool=${normalizedName} toolCallId=${toolCallId} skipContentAudit=${skipContentAudit} auditEnabled=${auditService?.isEnabled()}`);
        if (auditService?.isEnabled() && !skipContentAudit) {
          // Check if this specific tool call was already blocked (prevents duplicate prompts after rejection)
          if (blockedToolCalls.has(toolCallId)) {
            logDebug(`[ContentAudit] 跳过审核（已被拒绝）: tool=${normalizedName} toolCallId=${toolCallId}`);
            return jsonResult({
              status: "blocked",
              tool: normalizedName,
              message: "此工具执行已被用户拒绝。",
              canRetry: false,
            });
          }

          try {
            // Audit the tool call description
            const auditText = `工具调用: ${normalizedName}\n参数: ${JSON.stringify(params)}`;
            const auditResult = await auditService.auditText(auditText);
            logDebug(
              `[ContentAudit] 工具执行前审计: tool=${normalizedName} label=${auditResult.label} action=${auditResult.action}`,
            );

            if (auditResult.action === "block") {
              logWarn(`[ContentAudit] 工具执行被阻止: ${normalizedName} - ${auditResult.description}`);
              blockedToolCalls.set(toolCallId, Date.now());
              return jsonResult({
                status: "blocked",
                tool: normalizedName,
                message: `内容安全审核未通过: ${auditResult.description}。请修改您的请求后重试。`,
                canRetry: false,
              });
            }

            if (auditResult.action === "confirm") {
              const approvalId = `tool:${toolCallId}:${Date.now()}`;
              const approvalTimeoutMs = config.security?.contentAudit?.timeoutMs ?? 30000;
              
              logInfo(`[ContentAudit] 等待用户确认工具执行: ${normalizedName} id=${approvalId}`);
              
              // Broadcast confirmation request to UI
              broadcastGatewayEvent("contentAuditApproval", {
                type: "request",
                record: {
                  id: approvalId,
                  request: {
                    userMessage: "",
                    aiResponse: auditText,
                    label: auditResult.label,
                    description: auditResult.description,
                    riskLevel: auditResult.riskLevel,
                    confidence: auditResult.confidence,
                    toolName: normalizedName,
                    toolArgs: params,
                  },
                  createdAtMs: Date.now(),
                  expiresAtMs: Date.now() + approvalTimeoutMs,
                },
              });

              const decision = await waitForToolAuditApproval(approvalId, approvalTimeoutMs);
              
              if (decision === "block" || decision === null) {
                const reason = decision === null ? "确认超时" : "用户拒绝";
                logWarn(`[ContentAudit] ${reason}，工具执行被取消: ${normalizedName} id=${approvalId}`);
                blockedToolCalls.set(toolCallId, Date.now());
                return jsonResult({
                  status: "blocked",
                  tool: normalizedName,
                  message: `工具执行被${reason === "确认超时" ? "超时取消" : "用户拒绝"}。如需继续，请重新发起对话。`,
                  canRetry: false,
                });
              }
              
              logInfo(`[ContentAudit] 用户已确认放行工具执行: ${normalizedName} id=${approvalId}`);
              // Don't cache "allowed" - each tool call should be audited independently
            }
            // action === "allow" - proceed to execute without caching
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logWarn(`[ContentAudit] 工具执行前审计失败: ${errorMessage}`);
            // Continue with tool execution if audit fails (fail-open)
          }
        }

        try {
          return await tool.execute(toolCallId, params, signal, onUpdate);
        } catch (err) {
          if (signal?.aborted) throw err;
          const name =
            err && typeof err === "object" && "name" in err
              ? String((err as { name?: unknown }).name)
              : "";
          if (name === "AbortError") throw err;
          const described = describeToolExecutionError(err);
          if (described.stack && described.stack !== described.message) {
            logDebug(`tools: ${normalizedName} failed stack:\n${described.stack}`);
          }
          logError(`[tools] ${normalizedName} failed: ${described.message}`);
          return jsonResult({
            status: "error",
            tool: normalizedName,
            error: described.message,
          });
        }
      },
    } satisfies ToolDefinition;
  });
}

// Convert client tools (OpenResponses hosted tools) to ToolDefinition format
// These tools are intercepted to return a "pending" result instead of executing
export function toClientToolDefinitions(
  tools: ClientToolDefinition[],
  onClientToolCall?: (toolName: string, params: Record<string, unknown>) => void,
): ToolDefinition[] {
  return tools.map((tool) => {
    const func = tool.function;
    return {
      name: func.name,
      label: func.name,
      description: func.description ?? "",
      parameters: func.parameters as any,
      execute: async (
        toolCallId,
        params,
        _onUpdate: AgentToolUpdateCallback<unknown> | undefined,
        _ctx,
        _signal,
      ): Promise<AgentToolResult<unknown>> => {
        // Notify handler that a client tool was called
        if (onClientToolCall) {
          onClientToolCall(func.name, params as Record<string, unknown>);
        }
        // Return a pending result - the client will execute this tool
        return jsonResult({
          status: "pending",
          tool: func.name,
          message: "Tool execution delegated to client",
        });
      },
    } satisfies ToolDefinition;
  });
}
