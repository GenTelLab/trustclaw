import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { SlackStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";

export function renderSlackCard(params: {
  props: ChannelsProps;
  slack?: SlackStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, slack, accountCountLabel } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "Socket 模式状态和频道配置",
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
    sub: "Socket mode status and channel configuration.",
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
      <div class="card-title">Slack</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${txt.configured}</span>
          <span>${slack?.configured ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.running}</span>
          <span>${slack?.running ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.lastStart}</span>
          <span>${slack?.lastStartAt ? formatAgo(slack.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.lastProbe}</span>
          <span>${slack?.lastProbeAt ? formatAgo(slack.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${slack?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${slack.lastError}
          </div>`
        : nothing}

      ${slack?.probe
        ? html`<div class="callout" style="margin-top: 12px;">
            ${slack.probe.ok ? txt.probeOk : txt.probeFailed} ·
            ${slack.probe.status ?? ""} ${slack.probe.error ?? ""}
          </div>`
        : nothing}

      ${renderChannelConfigSection({ channelId: "slack", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.probe}
        </button>
      </div>
    </div>
  `;
}
