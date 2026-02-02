import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { resolveDingtalkAccount } from "./accounts.js";

export function collectDingtalkStatusIssues({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
}): string[] {
  const account = resolveDingtalkAccount({ cfg, accountId });
  const issues: string[] = [];

  if (!account.config.appKey) {
    issues.push("Missing appKey");
  }
  if (!account.config.appSecret) {
    issues.push("Missing appSecret");
  }

  return issues;
}
