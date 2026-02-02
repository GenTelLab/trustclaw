import type { OpenClawConfig } from "openclaw/plugin-sdk";

import { getDingtalkAccessToken, sendDingtalkMessage } from "./api.js";
import { resolveDingtalkAccount } from "./accounts.js";
import { getDingtalkRuntime } from "./runtime.js";

export async function sendMessageDingtalk({
  cfg,
  accountId,
  to,
  text,
  mediaUrls,
  replyToId,
}: {
  cfg: OpenClawConfig;
  accountId: string;
  to: string;
  text?: string;
  mediaUrls?: string[];
  replyToId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const account = resolveDingtalkAccount({ cfg, accountId });
  const runtime = getDingtalkRuntime();

  if (!account.config.appKey || !account.config.appSecret) {
    return { ok: false, error: "missing_credentials" };
  }

  if (!text && (!mediaUrls || mediaUrls.length === 0)) {
    return { ok: false, error: "no_content" };
  }

  try {
    // 获取访问令牌
    const accessToken = await getDingtalkAccessToken(
      account.config.appKey,
      account.config.appSecret,
      runtime,
    );

    // 发送文本消息
    if (text) {
      // 判断to是用户ID还是群聊ID
      const isChatId = to.startsWith("chat");
      const result = await sendDingtalkMessage({
        accessToken,
        chatId: isChatId ? to : undefined,
        userId: isChatId ? undefined : to,
        text,
        runtime,
      });

      if (!result.ok) {
        return result;
      }
    }

    // TODO: 处理媒体消息（mediaUrls）

    return { ok: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    runtime.error(`Dingtalk send failed: ${errorMessage}`);
    return { ok: false, error: errorMessage };
  }
}
