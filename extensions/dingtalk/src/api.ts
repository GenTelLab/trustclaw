import type { RuntimeEnv } from "openclaw/plugin-sdk";

export class DingtalkApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "DingtalkApiError";
  }
}

export async function getDingtalkAccessToken(
  appKey: string,
  appSecret: string,
  runtime?: RuntimeEnv,
): Promise<string> {
  const log = runtime?.log || console;
  const url = "https://oapi.dingtalk.com/gettoken";
  const params = new URLSearchParams({
    appkey: appKey,
    appsecret: appSecret,
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new DingtalkApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as { errcode?: number; errmsg?: string; access_token?: string };
    if (data.errcode !== 0) {
      throw new DingtalkApiError(
        data.errmsg || `API error: ${data.errcode}`,
        undefined,
        String(data.errcode),
      );
    }

    if (!data.access_token) {
      throw new DingtalkApiError("Missing access_token in response");
    }

    return data.access_token;
  } catch (err) {
    if (err instanceof DingtalkApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Dingtalk API error: ${message}`);
    throw new DingtalkApiError(`Failed to get access token: ${message}`);
  }
}

export async function sendDingtalkMessage(params: {
  accessToken: string;
  chatId?: string;
  userId?: string;
  text: string;
  runtime?: RuntimeEnv;
}): Promise<{ ok: boolean; error?: string }> {
  const { accessToken, chatId, userId, text, runtime } = params;
  const log = runtime?.log || console;

  if (!chatId && !userId) {
    return { ok: false, error: "chatId or userId is required" };
  }

  const url = "https://oapi.dingtalk.com/topapi/message/corpconversation/asyncsend_v2";
  const body = {
    agent_id: process.env.DINGTALK_AGENT_ID || "",
    userid_list: userId ? userId : undefined,
    dept_id_list: undefined,
    to_all_user: false,
    msg: {
      msgtype: "text",
      text: {
        content: text,
      },
    },
  };

  if (chatId) {
    // 群聊消息使用不同的 API
    const chatUrl = "https://oapi.dingtalk.com/chat/send";
    const chatBody = {
      chatid: chatId,
      msg: {
        msgtype: "text",
        text: {
          content: text,
        },
      },
    };

    try {
      const response = await fetch(`${chatUrl}?access_token=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatBody),
      });

      if (!response.ok) {
        throw new DingtalkApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const data = (await response.json()) as { errcode?: number; errmsg?: string };
      if (data.errcode !== 0) {
        throw new DingtalkApiError(
          data.errmsg || `API error: ${data.errcode}`,
          undefined,
          String(data.errcode),
        );
      }

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Dingtalk send message error: ${message}`);
      return { ok: false, error: message };
    }
  }

  try {
    const response = await fetch(`${url}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new DingtalkApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as { errcode?: number; errmsg?: string };
    if (data.errcode !== 0) {
      throw new DingtalkApiError(
        data.errmsg || `API error: ${data.errcode}`,
        undefined,
        String(data.errcode),
      );
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Dingtalk send message error: ${message}`);
    return { ok: false, error: message };
  }
}
