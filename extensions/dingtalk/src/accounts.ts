import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "openclaw/plugin-sdk";
import type { DingtalkAccountConfig } from "./config-schema.js";

export type ResolvedDingtalkAccount = {
  accountId: string;
  config: DingtalkAccountConfig;
};

export function listDingtalkAccountIds(cfg: OpenClawConfig): string[] {
  const accounts = cfg.channels?.dingtalk?.accounts;
  if (!accounts || typeof accounts !== "object") return [];
  return Object.keys(accounts).map(normalizeAccountId);
}

export function resolveDefaultDingtalkAccountId(cfg: OpenClawConfig): string {
  return DEFAULT_ACCOUNT_ID;
}

export function resolveDingtalkAccount({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId?: string;
}): ResolvedDingtalkAccount {
  const normalizedId = normalizeAccountId(accountId ?? DEFAULT_ACCOUNT_ID);
  const accounts = cfg.channels?.dingtalk?.accounts;
  const accountConfig =
    (accounts && typeof accounts === "object" && accounts[normalizedId]
      ? accounts[normalizedId]
      : cfg.channels?.dingtalk) as DingtalkAccountConfig | undefined;

  return {
    accountId: normalizedId,
    config: accountConfig || {},
  };
}
