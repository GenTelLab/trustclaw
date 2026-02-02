import type { OpenClawConfig } from "openclaw/plugin-sdk";
import { getDingtalkAccessToken } from "./api.js";
import { resolveDingtalkAccount } from "./accounts.js";
import { getDingtalkRuntime } from "./runtime.js";

export async function probeDingtalk({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  const account = resolveDingtalkAccount({ cfg, accountId });
  const runtime = getDingtalkRuntime();

  if (!account.config.appKey || !account.config.appSecret) {
    return { ok: false, error: "missing_credentials" };
  }

  try {
    await getDingtalkAccessToken(account.config.appKey, account.config.appSecret, runtime);
    return { ok: true, status: 200 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { ok: false, error: errorMessage };
  }
}
