import { html, nothing } from "lit";

import { formatPresenceAge, formatPresenceSummary } from "../presenter";
import type { PresenceEntry } from "../types";
import type { Lang } from "../storage";
import { getSection } from "../i18n";

export type InstancesProps = {
  loading: boolean;
  entries: PresenceEntry[];
  lastError: string | null;
  statusMessage: string | null;
  lang: Lang;
  onRefresh: () => void;
};

export function renderInstances(props: InstancesProps) {
  const lang = props.lang || "en";
  const t = getSection(lang, "instances");
  const tc = getSection(lang, "common");
  
  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t.title}</div>
          <div class="card-sub">${t.subtitle}</div>
        </div>
        <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
          ${props.loading ? tc.loading : tc.refresh}
        </button>
      </div>
      ${props.lastError
        ? html`<div class="callout danger" style="margin-top: 12px;">
            ${props.lastError}
          </div>`
        : nothing}
      ${props.statusMessage
        ? html`<div class="callout" style="margin-top: 12px;">
            ${props.statusMessage}
          </div>`
        : nothing}
      <div class="list" style="margin-top: 16px;">
        ${props.entries.length === 0
          ? html`<div class="muted">${t.noInstances}</div>`
          : props.entries.map((entry) => renderEntry(entry, lang))}
      </div>
    </section>
  `;
}

function renderEntry(entry: PresenceEntry, lang: Lang) {
  const t = getSection(lang, "instances");
  const lastInput =
    entry.lastInputSeconds != null
      ? `${entry.lastInputSeconds}s ago`
      : "n/a";
  const mode = entry.mode ?? "unknown";
  const roles = Array.isArray(entry.roles) ? entry.roles.filter(Boolean) : [];
  const scopes = Array.isArray(entry.scopes) ? entry.scopes.filter(Boolean) : [];
  const scopesLabel =
    scopes.length > 0
      ? scopes.length > 3
        ? `${scopes.length} scopes`
        : `scopes: ${scopes.join(", ")}`
      : null;
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">${entry.host ?? "unknown host"}</div>
        <div class="list-sub">${formatPresenceSummary(entry)}</div>
        <div class="chip-row">
          <span class="chip">${mode}</span>
          ${roles.map((role) => html`<span class="chip">${role}</span>`)}
          ${scopesLabel ? html`<span class="chip">${scopesLabel}</span>` : nothing}
          ${entry.platform ? html`<span class="chip">${entry.platform}</span>` : nothing}
          ${entry.deviceFamily
            ? html`<span class="chip">${entry.deviceFamily}</span>`
            : nothing}
          ${entry.modelIdentifier
            ? html`<span class="chip">${entry.modelIdentifier}</span>`
            : nothing}
          ${entry.version ? html`<span class="chip">${entry.version}</span>` : nothing}
        </div>
      </div>
      <div class="list-meta">
        <div>${formatPresenceAge(entry)}</div>
        <div class="muted">${t.lastSeen}: ${lastInput}</div>
        <div class="muted">Reason ${entry.reason ?? ""}</div>
      </div>
    </div>
  `;
}
