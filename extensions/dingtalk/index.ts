import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

import { dingtalkDock, dingtalkPlugin } from "./src/channel.js";
import { handleDingtalkWebhookRequest } from "./src/monitor.js";
import { setDingtalkRuntime } from "./src/runtime.js";

const plugin = {
  id: "dingtalk",
  name: "Dingtalk",
  description: "Dingtalk (钉钉) channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setDingtalkRuntime(api.runtime);
    api.registerChannel({ plugin: dingtalkPlugin, dock: dingtalkDock });
    api.registerHttpHandler((req, res) => handleDingtalkWebhookRequest(req, res, api.config));
  },
};

export default plugin;
