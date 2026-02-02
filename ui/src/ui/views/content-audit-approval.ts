import { html, nothing } from "lit";

import type { AppViewState } from "../app-view-state";

const LABEL_DISPLAY: Record<string, string> = {
  normal: "正常内容",
  porn: "色情内容",
  politics: "政治内容",
  violence: "恐暴内容",
  illegal: "违禁内容",
  discrimination: "歧视内容",
  unethical: "不良内容",
};

const RISK_LEVEL_DISPLAY: Record<string, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "严重风险",
};

function formatRemaining(ms: number): string {
  const remaining = Math.max(0, ms);
  const totalSeconds = Math.floor(remaining / 1000);
  if (totalSeconds < 60) return `${totalSeconds}秒`;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}分钟`;
}

export function renderContentAuditApprovalPrompt(state: AppViewState) {
  const active = state.contentAuditApprovalQueue[0];
  if (!active) return nothing;

  const { request } = active;
  const remainingMs = active.expiresAtMs - Date.now();
  const remaining = remainingMs > 0 ? `${formatRemaining(remainingMs)}后超时` : "已超时";
  const queueCount = state.contentAuditApprovalQueue.length;

  const labelDisplay = LABEL_DISPLAY[request.label] ?? request.label;
  const riskDisplay = RISK_LEVEL_DISPLAY[request.riskLevel] ?? request.riskLevel;
  const confidencePercent = Math.round(request.confidence * 100);

  // Check if this is a tool execution approval (has toolName)
  const isToolApproval = request.toolName && typeof request.toolName === "string";
  const title = isToolApproval ? "⚠️ 工具执行安全审核" : "⚠️ AI响应内容审核";
  const allowText = isToolApproval ? "✓ 允许执行" : "✓ 放行回答";
  const blockText = isToolApproval ? "✗ 拒绝执行" : "✗ 拦截回答";

  return html`
    <div class="exec-approval-overlay" role="dialog" aria-live="polite">
      <div class="exec-approval-card content-audit-card">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">${title}</div>
            <div class="exec-approval-sub">${remaining}</div>
          </div>
          ${queueCount > 1
            ? html`<div class="exec-approval-queue">${queueCount} 待处理</div>`
            : nothing}
        </div>

        <div class="content-audit-info">
          <div class="content-audit-label">
            <span class="label-badge risk-${request.riskLevel}">${labelDisplay}</span>
            <span class="risk-level">${riskDisplay}</span>
            <span class="confidence">(${confidencePercent}%)</span>
          </div>
          <div class="content-audit-description">${request.description}</div>
        </div>

        ${isToolApproval
          ? html`
              <div class="content-audit-preview tool-preview">
                <div class="preview-label">🔧 即将执行的工具:</div>
                <div class="preview-text tool-name">${request.toolName}</div>
                ${request.toolArgs
                  ? html`<div class="preview-text tool-args">${JSON.stringify(request.toolArgs, null, 2)}</div>`
                  : nothing}
              </div>
            `
          : html`
              <div class="content-audit-preview">
                <div class="preview-label">👤 用户提问:</div>
                <div class="preview-text user-message">${request.userMessage || "(无)"}</div>
              </div>
            `}

        <div class="content-audit-preview ai-response-preview">
          <div class="preview-label">🤖 AI回答 ${isToolApproval ? "(触发工具调用)" : "(待审核)"}:</div>
          <div class="preview-text ai-response">${request.aiResponse || "(无)"}</div>
        </div>

        ${state.contentAuditApprovalError
          ? html`<div class="exec-approval-error">${state.contentAuditApprovalError}</div>`
          : nothing}

        <div class="exec-approval-actions">
          <button
            class="btn primary"
            ?disabled=${state.contentAuditApprovalBusy}
            @click=${() => state.handleContentAuditApprovalDecision("allow")}
          >
            ${allowText}
          </button>
          <button
            class="btn danger"
            ?disabled=${state.contentAuditApprovalBusy}
            @click=${() => state.handleContentAuditApprovalDecision("block")}
          >
            ${blockText}
          </button>
        </div>
      </div>
    </div>
  `;
}
