import type { RuntimeEnv } from "openclaw/plugin-sdk";

let feishuRuntime: RuntimeEnv | undefined;

export function setFeishuRuntime(runtime: RuntimeEnv) {
  feishuRuntime = runtime;
}

export function getFeishuRuntime(): RuntimeEnv {
  if (!feishuRuntime) {
    throw new Error("Feishu runtime not initialized");
  }
  return feishuRuntime;
}
