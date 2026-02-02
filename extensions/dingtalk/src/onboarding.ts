import type { ChannelOnboardingAdapter } from "openclaw/plugin-sdk";

export const dingtalkOnboardingAdapter: ChannelOnboardingAdapter = {
  async promptAccountConfig({ prompter }) {
    const appKey = await prompter.text({
      message: "Dingtalk App Key",
      validate: (value) => (value?.trim() ? undefined : "App Key is required"),
    });

    const appSecret = await prompter.text({
      message: "Dingtalk App Secret",
      validate: (value) => (value?.trim() ? undefined : "App Secret is required"),
    });

    return {
      appKey: String(appKey).trim(),
      appSecret: String(appSecret).trim(),
    };
  },
};
