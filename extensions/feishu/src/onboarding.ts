import type { OnboardingAdapter } from "openclaw/plugin-sdk";

export const feishuOnboardingAdapter: OnboardingAdapter = {
  async collectQuestions({ cfg, accountId }) {
    // TODO: 实现飞书onboarding问题收集
    return [];
  },
  async applyAnswers({ cfg, accountId, answers }) {
    // TODO: 实现飞书onboarding答案应用
    return { success: true };
  },
};
