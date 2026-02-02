import { randomUUID } from "node:crypto";

export type ContentAuditDecision = "allow" | "block";

export type ContentAuditApprovalPayload = {
  userMessage: string; // 用户发送的消息
  aiResponse: string; // AI 返回的内容（被审计的内容）
  label: string;
  description: string;
  riskLevel: string;
  confidence: number;
  sessionKey?: string;
};

export type ContentAuditApprovalRecord = {
  id: string;
  request: ContentAuditApprovalPayload;
  createdAtMs: number;
  expiresAtMs: number;
  resolvedAtMs?: number;
  decision?: ContentAuditDecision;
};

type PendingEntry = {
  record: ContentAuditApprovalRecord;
  resolve: (decision: ContentAuditDecision | null) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class ContentAuditApprovalManager {
  private pending = new Map<string, PendingEntry>();

  create(
    request: ContentAuditApprovalPayload,
    timeoutMs: number,
  ): ContentAuditApprovalRecord {
    const now = Date.now();
    const record: ContentAuditApprovalRecord = {
      id: randomUUID(),
      request,
      createdAtMs: now,
      expiresAtMs: now + timeoutMs,
    };
    return record;
  }

  async waitForDecision(
    record: ContentAuditApprovalRecord,
    timeoutMs: number,
  ): Promise<ContentAuditDecision | null> {
    return await new Promise<ContentAuditDecision | null>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(record.id);
        resolve(null); // Timeout = treat as block
      }, timeoutMs);
      this.pending.set(record.id, { record, resolve, timer });
    });
  }

  resolve(recordId: string, decision: ContentAuditDecision): boolean {
    const pending = this.pending.get(recordId);
    if (!pending) return false;
    clearTimeout(pending.timer);
    pending.record.resolvedAtMs = Date.now();
    pending.record.decision = decision;
    this.pending.delete(recordId);
    pending.resolve(decision);
    return true;
  }

  getSnapshot(recordId: string): ContentAuditApprovalRecord | null {
    const entry = this.pending.get(recordId);
    return entry?.record ?? null;
  }

  listPending(): ContentAuditApprovalRecord[] {
    return Array.from(this.pending.values()).map((e) => e.record);
  }
}

// Singleton instance
let manager: ContentAuditApprovalManager | null = null;

export function getContentAuditApprovalManager(): ContentAuditApprovalManager {
  if (!manager) {
    manager = new ContentAuditApprovalManager();
  }
  return manager;
}
