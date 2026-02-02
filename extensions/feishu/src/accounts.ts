import type { OpenClawConfig } from "openclaw/plugin-sdk";
import {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  resolveAccountConfig,
} from "openclaw/plugin-sdk";

import type { FeishuAccountConfig } from "./config-schema.js";

export type ResolvedFeishuAccount = {
  accountId: string;
  config: FeishuAccountConfig;
};

export function listFeishuAccountIds(cfg: OpenClawConfig): string[] {
  const section = cfg.channels?.feishu;
  if (!section || typeof section !== "object") return [];
  const ids = new Set<string>();
  if (section.enabled !== false && (section.appId || section.appSecret)) {
    ids.add(DEFAULT_ACCOUNT_ID);
  }
  for (const [key, value] of Object.entries(section)) {
    if (key === "enabled" || key === "appId" || key === "appSecret") continue;
    if (value && typeof value === "object" && "enabled" in value) {
      const accountId = normalizeAccountId(key);
      if (accountId) ids.add(accountId);
    }
  }
  return Array.from(ids).sort();
}

export function resolveDefaultFeishuAccountId(cfg: OpenClawConfig): string {
  return DEFAULT_ACCOUNT_ID;
}

export function resolveFeishuAccount({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
}): ResolvedFeishuAccount {
  const normalizedId = normalizeAccountId(accountId);
  const section = cfg.channels?.feishu;
  const accountConfig = resolveAccountConfig<FeishuAccountConfig>({
    section,
    accountId: normalizedId,
    defaultAccountId: DEFAULT_ACCOUNT_ID,
  });
  return {
    accountId: normalizedId,
    config: accountConfig,
  };
}
