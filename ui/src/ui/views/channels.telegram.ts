import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { ChannelAccountSnapshot, TelegramStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";

export function renderTelegramCard(params: {
  props: ChannelsProps;
  telegram?: TelegramStatus;
  telegramAccounts: ChannelAccountSnapshot[];
  accountCountLabel: unknown;
}) {
  const { props, telegram, telegramAccounts, accountCountLabel } = params;
  const hasMultipleAccounts = telegramAccounts.length > 1;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "机器人状态和频道配置",
    configured: "已配置",
    running: "运行中",
    connected: "已连接",
    lastInbound: "最后接收",
    mode: "模式",
    lastStart: "最后启动",
    lastProbe: "最后探测",
    yes: "是",
    no: "否",
    probeOk: "探测成功",
    probeFailed: "探测失败",
    probe: "探测",
  } : {
    sub: "Bot status and channel configuration.",
    configured: "Configured",
    running: "Running",
    connected: "Connected",
    lastInbound: "Last inbound",
    mode: "Mode",
    lastStart: "Last start",
    lastProbe: "Last probe",
    yes: "Yes",
    no: "No",
    probeOk: "Probe ok",
    probeFailed: "Probe failed",
    probe: "Probe",
  };

  const renderAccountCard = (account: ChannelAccountSnapshot) => {
    const probe = account.probe as { bot?: { username?: string } } | undefined;
    const botUsername = probe?.bot?.username;
    const label = account.name || account.accountId;
    return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">
            ${botUsername ? `@${botUsername}` : label}
          </div>
          <div class="account-card-id">${account.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${txt.running}</span>
            <span>${account.running ? txt.yes : txt.no}</span>
          </div>
          <div>
            <span class="label">${txt.configured}</span>
            <span>${account.configured ? txt.yes : txt.no}</span>
          </div>
          <div>
            <span class="label">${txt.lastInbound}</span>
            <span>${account.lastInboundAt ? formatAgo(account.lastInboundAt) : "n/a"}</span>
          </div>
          ${account.lastError
            ? html`
                <div class="account-card-error">
                  ${account.lastError}
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  };

  return html`
    <div class="card">
      <div class="card-title">Telegram</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      ${hasMultipleAccounts
        ? html`
            <div class="account-card-list">
              ${telegramAccounts.map((account) => renderAccountCard(account))}
            </div>
          `
        : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${txt.configured}</span>
                <span>${telegram?.configured ? txt.yes : txt.no}</span>
              </div>
              <div>
                <span class="label">${txt.running}</span>
                <span>${telegram?.running ? txt.yes : txt.no}</span>
              </div>
              <div>
                <span class="label">${txt.mode}</span>
                <span>${telegram?.mode ?? "n/a"}</span>
              </div>
              <div>
                <span class="label">${txt.lastStart}</span>
                <span>${telegram?.lastStartAt ? formatAgo(telegram.lastStartAt) : "n/a"}</span>
              </div>
              <div>
                <span class="label">${txt.lastProbe}</span>
                <span>${telegram?.lastProbeAt ? formatAgo(telegram.lastProbeAt) : "n/a"}</span>
              </div>
            </div>
          `}

      ${telegram?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${telegram.lastError}
          </div>`
        : nothing}

      ${telegram?.probe
        ? html`<div class="callout" style="margin-top: 12px;">
            ${telegram.probe.ok ? txt.probeOk : txt.probeFailed} ·
            ${telegram.probe.status ?? ""} ${telegram.probe.error ?? ""}
          </div>`
        : nothing}

      ${renderChannelConfigSection({ channelId: "telegram", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.probe}
        </button>
      </div>
    </div>
  `;
}
