import {
  getContentAuditApprovalManager,
  type ContentAuditDecision,
} from "../content-audit-approval.js";
import { resolveToolAuditApproval } from "../../agents/pi-tool-definition-adapter.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const contentAuditHandlers: GatewayRequestHandlers = {
  "contentAudit.resolve": ({ params, respond }) => {
    const { id, decision } = params as {
      id?: string;
      decision?: ContentAuditDecision;
    };

    if (!id || typeof id !== "string") {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "id is required"));
      return;
    }

    if (decision !== "allow" && decision !== "block") {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "decision must be 'allow' or 'block'"),
      );
      return;
    }

    // Try to resolve in the chat-level approval manager first
    const manager = getContentAuditApprovalManager();
    let resolved = manager.resolve(id, decision);

    // If not found, try the tool-level approval (from pi-tool-definition-adapter)
    if (!resolved) {
      resolved = resolveToolAuditApproval(id, decision);
    }

    if (!resolved) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "approval request not found or expired"));
      return;
    }

    respond(true, { ok: true, id, decision });
  },

  "contentAudit.list": ({ respond }) => {
    const manager = getContentAuditApprovalManager();
    const pending = manager.listPending();
    respond(true, { pending });
  },
};
