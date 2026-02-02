import type { RuntimeEnv } from "openclaw/plugin-sdk";

let dingtalkRuntime: RuntimeEnv | null = null;

export function setDingtalkRuntime(runtime: RuntimeEnv) {
  dingtalkRuntime = runtime;
}

export function getDingtalkRuntime(): RuntimeEnv {
  if (!dingtalkRuntime) {
    throw new Error("Dingtalk runtime not initialized");
  }
  return dingtalkRuntime;
}
