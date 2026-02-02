import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { WhatsAppStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { formatDuration } from "./channels.shared";

export function renderWhatsAppCard(params: {
  props: ChannelsProps;
  whatsapp?: WhatsAppStatus;
  accountCountLabel: unknown;
}) {
  const { props, whatsapp, accountCountLabel } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "关联 WhatsApp Web 并监控连接状态",
    configured: "已配置",
    linked: "已关联",
    running: "运行中",
    connected: "已连接",
    lastConnect: "最后连接",
    lastMessage: "最后消息",
    authAge: "认证时长",
    yes: "是",
    no: "否",
    working: "处理中…",
    showQR: "显示二维码",
    relink: "重新关联",
    waitForScan: "等待扫描",
    logout: "退出登录",
    refresh: "刷新",
  } : {
    sub: "Link WhatsApp Web and monitor connection health.",
    configured: "Configured",
    linked: "Linked",
    running: "Running",
    connected: "Connected",
    lastConnect: "Last connect",
    lastMessage: "Last message",
    authAge: "Auth age",
    yes: "Yes",
    no: "No",
    working: "Working…",
    showQR: "Show QR",
    relink: "Relink",
    waitForScan: "Wait for scan",
    logout: "Logout",
    refresh: "Refresh",
  };

  return html`
    <div class="card">
      <div class="card-title">WhatsApp</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${txt.configured}</span>
          <span>${whatsapp?.configured ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.linked}</span>
          <span>${whatsapp?.linked ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.running}</span>
          <span>${whatsapp?.running ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.connected}</span>
          <span>${whatsapp?.connected ? txt.yes : txt.no}</span>
        </div>
        <div>
          <span class="label">${txt.lastConnect}</span>
          <span>
            ${whatsapp?.lastConnectedAt
              ? formatAgo(whatsapp.lastConnectedAt)
              : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${txt.lastMessage}</span>
          <span>
            ${whatsapp?.lastMessageAt ? formatAgo(whatsapp.lastMessageAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${txt.authAge}</span>
          <span>
            ${whatsapp?.authAgeMs != null
              ? formatDuration(whatsapp.authAgeMs)
              : "n/a"}
          </span>
        </div>
      </div>

      ${whatsapp?.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${whatsapp.lastError}
          </div>`
        : nothing}

      ${props.whatsappMessage
        ? html`<div class="callout" style="margin-top: 12px;">
            ${props.whatsappMessage}
          </div>`
        : nothing}

      ${props.whatsappQrDataUrl
        ? html`<div class="qr-wrap">
            <img src=${props.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`
        : nothing}

      <div class="row" style="margin-top: 14px; flex-wrap: wrap;">
        <button
          class="btn primary"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppStart(false)}
        >
          ${props.whatsappBusy ? txt.working : txt.showQR}
        </button>
        <button
          class="btn"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppStart(true)}
        >
          ${txt.relink}
        </button>
        <button
          class="btn"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppWait()}
        >
          ${txt.waitForScan}
        </button>
        <button
          class="btn danger"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppLogout()}
        >
          ${txt.logout}
        </button>
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${txt.refresh}
        </button>
      </div>

      ${renderChannelConfigSection({ channelId: "whatsapp", props })}
    </div>
  `;
}
