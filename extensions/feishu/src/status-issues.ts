import type { OpenClawConfig } from "openclaw/plugin-sdk";

import { resolveFeishuAccount } from "./accounts.js";

export function collectFeishuStatusIssues({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
}): Array<{ severity: "error" | "warn"; message: string }> {
  const account = resolveFeishuAccount({ cfg, accountId });
  const issues: Array<{ severity: "error" | "warn"; message: string }> = [];

  if (!account.config.appId) {
    issues.push({ severity: "error", message: "App ID未配置" });
  }
  if (!account.config.appSecret) {
    issues.push({ severity: "error", message: "App Secret未配置" });
  }
  if (!account.config.webhookPath) {
    issues.push({ severity: "warn", message: "Webhook路径未配置" });
  }

  return issues;
}
