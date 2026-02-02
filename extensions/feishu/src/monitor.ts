import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig } from "openclaw/plugin-sdk";
import type { OpenClawConfig } from "openclaw/plugin-sdk";

import { resolveFeishuAccount } from "./accounts.js";
import { getFeishuRuntime } from "./runtime.js";

export type FeishuWebhookTarget = {
  accountId: string;
  webhookPath: string;
  handler: (event: FeishuWebhookEvent) => Promise<void>;
};

const webhookTargets = new Map<string, FeishuWebhookTarget>();

export function registerFeishuWebhookTarget(target: FeishuWebhookTarget): () => void {
  const key = `${target.accountId}:${target.webhookPath}`;
  webhookTargets.set(key, target);
  return () => {
    webhookTargets.delete(key);
  };
}

export type FeishuWebhookEvent = {
  type: string;
  [key: string]: unknown;
};

async function readJsonBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  return new Promise((resolve, reject) => {
    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error(`Request body too large: ${totalBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf-8");
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

    req.on("error", reject);
  });
}

export async function handleFeishuWebhookRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url;
  if (!url) return false;

  // 查找匹配的webhook target
  let matchedTarget: FeishuWebhookTarget | undefined;
  for (const target of webhookTargets.values()) {
    if (url === target.webhookPath || url.startsWith(`${target.webhookPath}/`)) {
      matchedTarget = target;
      break;
    }
  }

  if (!matchedTarget) return false;

  const runtime = getFeishuRuntime();
  const cfg = loadConfig();

  try {
    // 读取请求体
    const body = (await readJsonBody(req, 1024 * 1024)) as FeishuWebhookEvent;

    // 验证请求（TODO: 实现飞书webhook签名验证）
    // const signature = req.headers["x-lark-signature"];
    // if (!verifyFeishuSignature(body, signature)) {
    //   res.writeHead(401);
    //   res.end();
    //   return true;
    // }

    // 处理webhook事件
    await matchedTarget.handler(body);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 0, msg: "success" }));
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    runtime.error(`Feishu webhook error: ${errorMessage}`);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 1, msg: errorMessage }));
    return true;
  }
}
