import type { OpenClawConfig } from "openclaw/plugin-sdk";

import { getFeishuAccessToken } from "./api.js";
import { resolveFeishuAccount } from "./accounts.js";
import { getFeishuRuntime } from "./runtime.js";

export async function probeFeishu({
  cfg,
  accountId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  const account = resolveFeishuAccount({ cfg, accountId });
  const runtime = getFeishuRuntime();

  if (!account.config.appId || !account.config.appSecret) {
    return { ok: false, error: "missing_credentials" };
  }

  try {
    // 尝试获取访问令牌来验证凭证
    await getFeishuAccessToken(account.config.appId, account.config.appSecret, runtime);
    return { ok: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    runtime.error(`Feishu probe failed: ${errorMessage}`);
    return { ok: false, error: errorMessage };
  }
}
