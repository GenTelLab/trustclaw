import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { IMessageStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";

export function renderIMessageCard(params: {
  props: ChannelsProps;
  imessage?: IMessageStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, imessage, accountCountLabel } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "macOS 桥接状态和频道配置",
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
    sub: "macOS bridge status and channel configuration.",
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
      <div class="card-title">iMessage</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${txt.configured}</span>
          <span>${imessage?.configured ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.running}</span>
          <span>${imessage?.running ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.lastStart}</span>
          <span>${imessage?.lastStartAt ? formatAgo(imessage.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.lastProbe}</span>
          <span>${imessage?.lastProbeAt ? formatAgo(imessage.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${imessage?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${imessage.lastError}
          </div>`
        : nothing}

      ${imessage?.probe
        ? html`<div class="callout" style="margin-top: 12px;">
            ${imessage.probe.ok ? txt.probeOk : txt.probeFailed} ·
            ${imessage.probe.error ?? ""}
          </div>`
        : nothing}

      ${renderChannelConfigSection({ channelId: "imessage", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.probe}
        </button>
      </div>
    </div>
  `;
}
