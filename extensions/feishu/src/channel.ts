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
  listFeishuAccountIds,
  resolveDefaultFeishuAccountId,
  resolveFeishuAccount,
  type ResolvedFeishuAccount,
} from "./accounts.js";
import { FeishuConfigSchema } from "./config-schema.js";
import { feishuOnboardingAdapter } from "./onboarding.js";
import { probeFeishu } from "./probe.js";
import { sendMessageFeishu } from "./send.js";
import { collectFeishuStatusIssues } from "./status-issues.js";

const meta = {
  id: "feishu",
  label: "Feishu",
  selectionLabel: "Feishu (Lark)",
  docsPath: "/channels/feishu",
  docsLabel: "feishu",
  blurb: "Lark/Feishu Bot API integration.",
  aliases: ["lark"],
  order: 70,
  quickstartAllowFrom: true,
};

function normalizeFeishuMessagingTarget(raw: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^(feishu|lark):/i, "");
}

export const feishuDock: ChannelDock = {
  id: "feishu",
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    blockStreaming: true,
  },
  outbound: { textChunkLimit: 4000 },
  config: {
    resolveAllowFrom: ({ cfg, accountId }) =>
      (
        resolveFeishuAccount({ cfg: cfg as OpenClawConfig, accountId }).config.allowFrom ?? []
      ).map((entry) => String(entry)),
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/^(feishu|lark):/i, ""))
        .map((entry) => entry.toLowerCase()),
  },
  groups: {
    resolveRequireMention: () => true,
  },
  threading: {
    resolveReplyToMode: () => "off",
  },
};

export const feishuPlugin: ChannelPlugin<ResolvedFeishuAccount> = {
  id: "feishu",
  meta,
  onboarding: feishuOnboardingAdapter,
  capabilities: {
    chatTypes: ["direct", "group"],
    media: true,
    reactions: false,
    threads: false,
    polls: false,
    nativeCommands: false,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.feishu"] },
  configSchema: buildChannelConfigSchema(FeishuConfigSchema),
  config: {
    listAccountIds: (cfg) => listFeishuAccountIds(cfg as OpenClawConfig),
    resolveAccount: (cfg, accountId) =>
      resolveFeishuAccount({ cfg: cfg as OpenClawConfig, accountId }),
    defaultAccountId: (cfg) => resolveDefaultFeishuAccountId(cfg as OpenClawConfig),
    setAccountEnabled: ({ cfg, accountId, enabled }) =>
      setAccountEnabledInConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "feishu",
        accountId,
        enabled,
        allowTopLevel: true,
      }),
    deleteAccount: ({ cfg, accountId }) =>
      deleteAccountFromConfigSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "feishu",
        accountId,
        allowTopLevel: true,
      }),
    applyAccountName: ({ cfg, accountId, name }) =>
      applyAccountNameToChannelSection({
        cfg: cfg as OpenClawConfig,
        sectionKey: "feishu",
        accountId,
        name,
        allowTopLevel: true,
      }),
    migrateBaseNameToDefaultAccount: ({ cfg }) =>
      migrateBaseNameToDefaultAccount({
        cfg: cfg as OpenClawConfig,
        sectionKey: "feishu",
        allowTopLevel: true,
      }),
  },
  pairing: {
    resolvePairingStatus: ({ cfg, accountId }) => {
      const account = resolveFeishuAccount({ cfg: cfg as OpenClawConfig, accountId });
      if (!account.config.appId || !account.config.appSecret) {
        return { status: "missing_credentials" };
      }
      // TODO: 实现实际的配对状态检查
      return { status: "paired" };
    },
    formatPairingHint: ({ cfg, accountId }) => {
      const account = resolveFeishuAccount({ cfg: cfg as OpenClawConfig, accountId });
      return formatPairingApproveHint({
        channel: "feishu",
        accountId,
        accountName: account.config.name,
        hint: "配置 App ID 和 App Secret 后，在飞书开放平台配置 webhook URL",
      });
    },
    formatPairingApprovedMessage: ({ accountId }) =>
      PAIRING_APPROVED_MESSAGE.replace("{{channel}}", "feishu").replace(
        "{{accountId}}",
        accountId,
      ),
  },
  status: {
    probe: ({ cfg, accountId }) => probeFeishu({ cfg: cfg as OpenClawConfig, accountId }),
    collectIssues: ({ cfg, accountId }) =>
      collectFeishuStatusIssues({ cfg: cfg as OpenClawConfig, accountId }),
  },
  send: {
    sendMessage: ({ cfg, accountId, to, text, mediaUrls, replyToId }) =>
      sendMessageFeishu({
        cfg: cfg as OpenClawConfig,
        accountId,
        to: normalizeFeishuMessagingTarget(to) ?? to,
        text,
        mediaUrls,
        replyToId,
      }),
  },
  normalizeMessagingTarget: normalizeFeishuMessagingTarget,
};
