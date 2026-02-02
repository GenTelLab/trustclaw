import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { GoogleChatStatus } from "../types";
import { renderChannelConfigSection } from "./channels.config";
import type { ChannelsProps } from "./channels.types";

export function renderGoogleChatCard(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "Chat API webhook 状态和频道配置",
    configured: "已配置",
    running: "运行中",
    credential: "凭证",
    audience: "受众",
    lastStart: "最后启动",
    lastProbe: "最后探测",
    yes: "是",
    no: "否",
    probeOk: "探测成功",
    probeFailed: "探测失败",
    probe: "探测",
  } : {
    sub: "Chat API webhook status and channel configuration.",
    configured: "Configured",
    running: "Running",
    credential: "Credential",
    audience: "Audience",
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
      <div class="card-title">Google Chat</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${txt.configured}</span>
          <span>${googleChat ? (googleChat.configured ? txt.yes : txt.no) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.running}</span>
          <span>${googleChat ? (googleChat.running ? txt.yes : txt.no) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.credential}</span>
          <span>${googleChat?.credentialSource ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.audience}</span>
          <span>
            ${googleChat?.audienceType
              ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
              : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${txt.lastStart}</span>
          <span>${googleChat?.lastStartAt ? formatAgo(googleChat.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${txt.lastProbe}</span>
          <span>${googleChat?.lastProbeAt ? formatAgo(googleChat.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${googleChat?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${googleChat.lastError}
          </div>`
        : nothing}

      ${googleChat?.probe
        ? html`<div class="callout" style="margin-top: 12px;">
            ${googleChat.probe.ok ? txt.probeOk : txt.probeFailed} ·
            ${googleChat.probe.status ?? ""} ${googleChat.probe.error ?? ""}
          </div>`
        : nothing}

      ${renderChannelConfigSection({ channelId: "googlechat", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.probe}
        </button>
      </div>
    </div>
  `;
}
