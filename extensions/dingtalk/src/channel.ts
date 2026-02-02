import type {
  ChannelAccountSnapshot,
  ChannelDock,
  ChannelPlugin,
  OpenClawConfig,
} from "openclaw/plugin-sdk";
import {
  applyAccountNameToChannelSection,
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  deleteAccountFromConfigSection,
  formatPairingApproveHint,
  migrateBaseNameToDefaultAccount,
  normalizeAccountId,
  PAIRING_APPROVED_MESSAGE,
  setAccountEnabledInConfigSection,
} from "openclaw/plugin-sdk";

import {
  listDingtalkAccountIds,
  resolveDefaultDingtalkAccountId,
  resolveDingtalkAccount,
  type ResolvedDingtalkAccount,
} from "./accounts.js";
import { DingtalkConfigSchema } from "./config-schema.js";
import { dingtalkOnboardingAdapter } from "./onboarding.js";
import { probeDingtalk } from "./probe.js";
import { sendMessageDingtalk } from "./send.js";
import { collectDingtalkStatusIssues } from "./status-issues.js";

const meta = {
  id: "dingtalk",
  label: "Dingtalk",
  selectionLabel: "Dingtalk (钉钉)",
  docsPath: "/channels/dingtalk",
  docsLabel: "dingtalk",
  blurb: "Dingtalk Bot API integration.",
  aliases: ["ding"],
  order: 60,
  quickstartAllowFrom: true,
};

function normalizeDingtalkMessagingTarget(raw: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^(dingtalk|ding):/i, "");
}

export const dingtalkDock: ChannelDock = {
  id: "dingtalk",
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    blockStreaming: true,
  },
  outbound: { textChunkLimit: 4000 },
  config: {
    resolveAllowFrom: ({ cfg, accountId }) =>
      (
        resolveDingtalkAccount({ cfg: cfg as OpenClawConfig, accountId }).config.allowFrom ?? []
      ).map((entry) => String(entry)),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(dingtalk|ding):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
};

export const dingtalkPlugin: ChannelPlugin<ResolvedDingtalkAccount> = {
  id: "dingtalk",
  meta,
  onboarding: dingtalkOnboardingAdapter,
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    reactions: false,
    threads: false,
    polls: false,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.dingtalk"] },
  configSchema: buildChannelConfigSchema(DingtalkConfigSchema),
  config: {
    listAccountIds: (cfg) => listDingtalkAccountIds(cfg as OpenClawConfig),
    resolveAccount: (cfg, accountId) =>
      resolveDingtalkAccount({ cfg: cfg as OpenClawConfig, accountId }),
    defaultAccountId: (cfg) => resolveDefaultDingtalkAccountId(cfg as OpenClawConfig),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      setAccountEnabledInConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "dingtalk",
        accountId,
        enabled,
        allowTopLevel: true,
      }),
    deleteAccount: ({ cfg, accountId }) =>
      deleteAccountFromConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "dingtalk",
        accountId,
        allowTopLevel: true,
      }),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "dingtalk",
        accountId,
        name,
        allowTopLevel: true,
      }),
    migrateBaseNameToDefaultAccount: ({ cfg }) =>
      migrateBaseNameToDefaultAccount({
        cfg: cfg as OpenClawConfig,
        sectionKey: "dingtalk",
        allowTopLevel: true,
      }),
  },
  pairing: {
    resolvePairingStatus: ({ cfg, accountId }) => {
      const account = resolveDingtalkAccount({ cfg: cfg as OpenClawConfig, accountId });
      if (!account.config.appKey || !account.config.appSecret) {
        return { status: "missing_credentials" };
      }
      // TODO: 实现实际的配对状态检查
      return { status: "paired" };
    },
    formatPairingHint: ({ cfg, accountId }) => {
      const account = resolveDingtalkAccount({ cfg: cfg as OpenClawConfig, accountId });
      return formatPairingApproveHint({
        channel: "dingtalk",
        accountId,
        accountName: account.config.name,
        hint: "配置 App Key 和 App Secret 后，在钉钉开放平台配置 webhook URL",
      });
    },
    formatPairingApprovedMessage: ({ accountId }) =>
      PAIRING_APPROVED_MESSAGE.replace("{{channel}}", "dingtalk").replace(
        "{{accountId}}",
        accountId,
      ),
  },
  status: {
    probe: ({ cfg, accountId }) => probeDingtalk({ cfg: cfg as OpenClawConfig, accountId }),
    collectIssues: ({ cfg, accountId }) =>
      collectDingtalkStatusIssues({ cfg: cfg as OpenClawConfig, accountId }),
  },
  send: {
    sendMessage: ({ cfg, accountId, to, text, mediaUrls, replyToId }) =>
      sendMessageDingtalk({
        cfg: cfg as OpenClawConfig,
        accountId,
        to: normalizeDingtalkMessagingTarget(to) ?? to,
        text,
        mediaUrls,
        replyToId,
      }),
  },
};
