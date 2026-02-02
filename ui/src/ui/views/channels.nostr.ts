import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { ChannelAccountSnapshot, NostrStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import {
  renderNostrProfileForm,
  type NostrProfileFormState,
  type NostrProfileFormCallbacks,
} from "./channels.nostr-profile-form";

/**
 * Truncate a pubkey for display (shows first and last 8 chars)
 */
function truncatePubkey(pubkey: string | null | undefined): string {
  if (!pubkey) return "n/a";
  if (pubkey.length <= 20) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

export function renderNostrCard(params: {
  props: ChannelsProps;
  nostr?: NostrStatus | null;
  nostrAccounts: ChannelAccountSnapshot[];
  accountCountLabel: unknown;
  /** Profile form state (optional - if provided, shows form) */
  profileFormState?: NostrProfileFormState | null;
  /** Profile form callbacks */
  profileFormCallbacks?: NostrProfileFormCallbacks | null;
  /** Called when Edit Profile is clicked */
  onEditProfile?: () => void;
}) {
  const {
    props,
    nostr,
    nostrAccounts,
    accountCountLabel,
    profileFormState,
    profileFormCallbacks,
    onEditProfile,
  } = params;
  const lang = props.lang ?? "zh";
  
  const txt = lang === "zh" ? {
    sub: "通过 Nostr 中继的去中心化私信 (NIP-04)",
    configured: "已配置",
    running: "运行中",
    publicKey: "公钥",
    lastStart: "最后启动",
    lastInbound: "最后接收",
    yes: "是",
    no: "否",
    profile: "个人资料",
    editProfile: "编辑资料",
    name: "名称",
    displayName: "显示名称",
    about: "简介",
    nip05: "NIP-05",
    noProfile: "未设置个人资料。点击 \"编辑资料\" 添加名称、简介和头像。",
    refresh: "刷新",
  } : {
    sub: "Decentralized DMs via Nostr relays (NIP-04).",
    configured: "Configured",
    running: "Running",
    publicKey: "Public Key",
    lastStart: "Last start",
    lastInbound: "Last inbound",
    yes: "Yes",
    no: "No",
    profile: "Profile",
    editProfile: "Edit Profile",
    name: "Name",
    displayName: "Display Name",
    about: "About",
    nip05: "NIP-05",
    noProfile: "No profile set. Click \"Edit Profile\" to add your name, bio, and avatar.",
    refresh: "Refresh",
  };
  
  const primaryAccount = nostrAccounts[0];
  const summaryConfigured = nostr?.configured ?? primaryAccount?.configured ?? false;
  const summaryRunning = nostr?.running ?? primaryAccount?.running ?? false;
  const summaryPublicKey =
    nostr?.publicKey ??
    (primaryAccount as { publicKey?: string } | undefined)?.publicKey;
  const summaryLastStartAt = nostr?.lastStartAt ?? primaryAccount?.lastStartAt ?? null;
  const summaryLastError = nostr?.lastError ?? primaryAccount?.lastError ?? null;
  const hasMultipleAccounts = nostrAccounts.length > 1;
  const showingForm = profileFormState !== null && profileFormState !== undefined;

  const renderAccountCard = (account: ChannelAccountSnapshot) => {
    const publicKey = (account as { publicKey?: string }).publicKey;
    const profile = (account as { profile?: { name?: string; displayName?: string } }).profile;
    const displayName = profile?.displayName ?? profile?.name ?? account.name ?? account.accountId;

    return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${displayName}</div>
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
            <span class="label">${txt.publicKey}</span>
            <span class="monospace" title="${publicKey ?? ""}">${truncatePubkey(publicKey)}</span>
          </div>
          <div>
            <span class="label">${txt.lastInbound}</span>
            <span>${account.lastInboundAt ? formatAgo(account.lastInboundAt) : "n/a"}</span>
          </div>
          ${account.lastError
            ? html`
                <div class="account-card-error">${account.lastError}</div>
              `
            : nothing}
        </div>
      </div>
    `;
  };

  const renderProfileSection = () => {
    // If showing form, render the form instead of the read-only view
    if (showingForm && profileFormCallbacks) {
      return renderNostrProfileForm({
        state: profileFormState,
        callbacks: profileFormCallbacks,
        accountId: nostrAccounts[0]?.accountId ?? "default",
      });
    }

    const profile =
      (primaryAccount as
        | {
            profile?: {
              name?: string;
              displayName?: string;
              about?: string;
              picture?: string;
              nip05?: string;
            };
          }
        | undefined)?.profile ?? nostr?.profile;
    const { name, displayName, about, picture, nip05 } = profile ?? {};
    const hasAnyProfileData = name || displayName || about || picture || nip05;

    return html`
      <div style="margin-top: 16px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 500;">${txt.profile}</div>
          ${summaryConfigured
            ? html`
                <button
                  class="btn btn-sm"
                  @click=${onEditProfile}
                  style="font-size: 12px; padding: 4px 8px;"
                >
                  ${txt.editProfile}
                </button>
              `
            : nothing}
        </div>
        ${hasAnyProfileData
          ? html`
              <div class="status-list">
                ${picture
                  ? html`
                      <div style="margin-bottom: 8px;">
                        <img
                          src=${picture}
                          alt="Profile picture"
                          style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);"
                          @error=${(e: Event) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    `
                  : nothing}
                ${name ? html`<div><span class="label">${txt.name}</span><span>${name}</span></div>` : nothing}
                ${displayName
                  ? html`<div><span class="label">${txt.displayName}</span><span>${displayName}</span></div>`
                  : nothing}
                ${about
                  ? html`<div><span class="label">${txt.about}</span><span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${about}</span></div>`
                  : nothing}
                ${nip05 ? html`<div><span class="label">${txt.nip05}</span><span>${nip05}</span></div>` : nothing}
              </div>
            `
          : html`
              <div style="color: var(--text-muted); font-size: 13px;">
                ${txt.noProfile}
              </div>
            `}
      </div>
    `;
  };

  return html`
    <div class="card">
      <div class="card-title">Nostr</div>
      <div class="card-sub">${txt.sub}</div>
      ${accountCountLabel}

      ${hasMultipleAccounts
        ? html`
            <div class="account-card-list">
              ${nostrAccounts.map((account) => renderAccountCard(account))}
            </div>
          `
        : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${txt.configured}</span>
                <span>${summaryConfigured ? txt.yes : txt.no}</span>
              </div>
              <div>
                <span class="label">${txt.running}</span>
                <span>${summaryRunning ? txt.yes : txt.no}</span>
              </div>
              <div>
                <span class="label">${txt.publicKey}</span>
                <span class="monospace" title="${summaryPublicKey ?? ""}"
                  >${truncatePubkey(summaryPublicKey)}</span
                >
              </div>
              <div>
                <span class="label">${txt.lastStart}</span>
                <span>${summaryLastStartAt ? formatAgo(summaryLastStartAt) : "n/a"}</span>
              </div>
            </div>
          `}

      ${summaryLastError
        ? html`<div class="callout danger" style="margin-top: 12px;">${summaryLastError}</div>`
        : nothing}

      ${renderProfileSection()}

      ${renderChannelConfigSection({ channelId: "nostr", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(false)}>${txt.refresh}</button>
      </div>
    </div>
  `;
}
