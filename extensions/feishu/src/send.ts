import type { OpenClawConfig } from "openclaw/plugin-sdk";

import { getFeishuAccessToken, sendFeishuTextMessage } from "./api.js";
import { resolveFeishuAccount } from "./accounts.js";
import { getFeishuRuntime } from "./runtime.js";

export async function sendMessageFeishu({
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
  const account = resolveFeishuAccount({ cfg, accountId });
  const runtime = getFeishuRuntime();

  if (!account.config.appId || !account.config.appSecret) {
    return { ok: false, error: "missing_credentials" };
  }

  if (!text && (!mediaUrls || mediaUrls.length === 0)) {
    return { ok: false, error: "no_content" };
  }

  try {
    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(
      account.config.appId,
      account.config.appSecret,
      runtime,
    );

    // 发送文本消息
    if (text) {
      // 判断to是用户ID还是群聊ID
      // 飞书API需要指定receive_id_type
      const receiveIdType = to.startsWith("oc_") ? "open_id" : "chat_id";
      await sendFeishuTextMessage({
        accessToken,
        receiveId: to,
        receiveIdType,
        text,
        runtime,
      });
    }

    // TODO: 处理媒体消息（mediaUrls）

    return { ok: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    runtime.error(`Feishu send failed: ${errorMessage}`);
    return { ok: false, error: errorMessage };
  }
}
