import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { DiscordStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";

export function renderDiscordCard(params: {
  props: ChannelsProps;
  discord?: DiscordStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, discord, accountCountLabel } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "机器人状态和频道配置",
    configured: "已配置",
    running: "运行中",
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
    lastStart: "Last start",
    lastProbe: "Last probe",
    yes: "Yes",
    no: "No",
    probeOk: "Probe ok",
    probeFailed: "Probe failed",
    probe: "Probe",
  };

  return html`
    <div class="card">
      <div class="card-title">Discord</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${txt.configured}</span>
          <span>${discord?.configured ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.running}</span>
          <span>${discord?.running ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.lastStart}</span>
          <span>${discord?.lastStartAt ? formatAgo(discord.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.lastProbe}</span>
          <span>${discord?.lastProbeAt ? formatAgo(discord.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${discord?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${discord.lastError}
          </div>`
        : nothing}

      ${discord?.probe
        ? html`<div class="callout" style="margin-top: 12px;">
            ${discord.probe.ok ? txt.probeOk : txt.probeFailed} ·
            ${discord.probe.status ?? ""} ${discord.probe.error ?? ""}
          </div>`
        : nothing}

      ${renderChannelConfigSection({ channelId: "discord", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.probe}
        </button>
      </div>
    </div>
  `;
}
