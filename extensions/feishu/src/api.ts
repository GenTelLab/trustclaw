import type { RuntimeEnv } from "openclaw/plugin-sdk";
import { getFeishuRuntime } from "./runtime.js";

const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";

export type FeishuAccessTokenResponse = {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
};

export type FeishuMessageResponse = {
  code: number;
  msg: string;
  data?: {
    message_id?: string;
  };
};

export class FeishuApiError extends Error {
  constructor(
    public code: number,
    public msg: string,
    public response?: unknown,
  ) {
    super(`Feishu API error ${code}: ${msg}`);
    this.name = "FeishuApiError";
  }
}

export async function getFeishuAccessToken(
  appId: string,
  appSecret: string,
  runtime?: RuntimeEnv,
): Promise<string> {
  const rt = runtime ?? getFeishuRuntime();
  const url = `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`;
  const body = JSON.stringify({
    app_id: appId,
    app_secret: appSecret,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as FeishuAccessTokenResponse;
    if (data.code !== 0) {
      throw new FeishuApiError(data.code, data.msg, data);
    }

    if (!data.tenant_access_token) {
      throw new FeishuApiError(0, "Missing tenant_access_token in response", data);
    }

    return data.tenant_access_token;
  } catch (err) {
    if (err instanceof FeishuApiError) {
      throw err;
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new FeishuApiError(0, `Failed to get access token: ${errorMessage}`);
  }
}

export async function sendFeishuMessage(params: {
  accessToken: string;
  receiveId: string;
  receiveIdType: "open_id" | "user_id" | "union_id" | "email" | "chat_id";
  msgType: "text" | "post" | "image" | "file" | "audio" | "media" | "sticker" | "interactive";
  content: Record<string, unknown>;
  runtime?: RuntimeEnv;
}): Promise<FeishuMessageResponse> {
  const { accessToken, receiveId, receiveIdType, msgType, content, runtime } = params;
  const rt = runtime ?? getFeishuRuntime();
  const url = `${FEISHU_API_BASE}/im/v1/messages?receive_id_type=${receiveIdType}`;

  const body = JSON.stringify({
    receive_id: receiveId,
    msg_type: msgType,
    content: JSON.stringify(content),
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = (await response.json()) as FeishuMessageResponse;
    if (data.code !== 0) {
      throw new FeishuApiError(data.code, data.msg, data);
    }

    return data;
  } catch (err) {
    if (err instanceof FeishuApiError) {
      throw err;
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new FeishuApiError(0, `Failed to send message: ${errorMessage}`);
  }
}

export async function sendFeishuTextMessage(params: {
  accessToken: string;
  receiveId: string;
  receiveIdType: "open_id" | "user_id" | "union_id" | "email" | "chat_id";
  text: string;
  runtime?: RuntimeEnv;
}): Promise<FeishuMessageResponse> {
  return sendFeishuMessage({
    ...params,
    msgType: "text",
    content: {
      text: params.text,
    },
  });
}
