import { html, nothing } from "lit";

import type { LogEntry, LogLevel } from "../types";
import type { Lang } from "../storage";
import { getSection } from "../i18n";

const LEVELS: LogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

export type LogsProps = {
  loading: boolean;
  error: string | null;
  file: string | null;
  entries: LogEntry[];
  filterText: string;
  levelFilters: Record<LogLevel, boolean>;
  autoFollow: boolean;
  truncated: boolean;
  lang: Lang;
  onFilterTextChange: (next: string) => void;
  onLevelToggle: (level: LogLevel, enabled: boolean) => void;
  onToggleAutoFollow: (next: boolean) => void;
  onRefresh: () => void;
  onExport: (lines: string[], label: string) => void;
  onScroll: (event: Event) => void;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString();
}

function matchesFilter(entry: LogEntry, needle: string) {
  if (!needle) return true;
  const haystack = [entry.message, entry.subsystem, entry.raw]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function renderLogs(props: LogsProps) {
  const lang = props.lang || "en";
  const t = getSection(lang, "logs");
  const tc = getSection(lang, "common");
  
  const needle = props.filterText.trim().toLowerCase();
  const levelFiltered = LEVELS.some((level) => !props.levelFilters[level]);
  const filtered = props.entries.filter((entry) => {
    if (entry.level && !props.levelFilters[entry.level]) return false;
    return matchesFilter(entry, needle);
  });
  const exportLabel = needle || levelFiltered ? (lang === "zh" ? "已筛选" : "filtered") : (lang === "zh" ? "可见" : "visible");

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between;">
        <div>
          <div class="card-title">${t.title}</div>
          <div class="card-sub">${t.subtitle}</div>
        </div>
        <div class="row" style="gap: 8px;">
          <button class="btn" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? tc.loading : tc.refresh}
          </button>
          <button
            class="btn"
            ?disabled=${filtered.length === 0}
            @click=${() => props.onExport(filtered.map((entry) => entry.raw), exportLabel)}
          >
            ${lang === "zh" ? "导出" : "Export"} ${exportLabel}
          </button>
        </div>
      </div>

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="min-width: 220px;">
          <span>${tc.filter}</span>
          <input
            .value=${props.filterText}
            @input=${(e: Event) =>
              props.onFilterTextChange((e.target as HTMLInputElement).value)}
            placeholder="${t.filterLogs}"
          />
        </label>
        <label class="field checkbox">
          <span>${t.autoFollow}</span>
          <input
            type="checkbox"
            .checked=${props.autoFollow}
            @change=${(e: Event) =>
              props.onToggleAutoFollow((e.target as HTMLInputElement).checked)}
          />
        </label>
      </div>

      <div class="chip-row" style="margin-top: 12px;">
        ${LEVELS.map(
          (level) => html`
            <label class="chip log-chip ${level}">
              <input
                type="checkbox"
                .checked=${props.levelFilters[level]}
                @change=${(e: Event) =>
                  props.onLevelToggle(level, (e.target as HTMLInputElement).checked)}
              />
              <span>${t[level] || level}</span>
            </label>
          `,
        )}
      </div>

      ${props.file
        ? html`<div class="muted" style="margin-top: 10px;">${lang === "zh" ? "文件" : "File"}: ${props.file}</div>`
        : nothing}
      ${props.truncated
        ? html`<div class="callout" style="margin-top: 10px;">
            ${lang === "zh" ? "日志输出已截断；显示最新部分。" : "Log output truncated; showing latest chunk."}
          </div>`
        : nothing}
      ${props.error
        ? html`<div class="callout danger" style="margin-top: 10px;">${props.error}</div>`
        : nothing}

      <div class="log-stream" style="margin-top: 12px;" @scroll=${props.onScroll}>
        ${filtered.length === 0
          ? html`<div class="muted" style="padding: 12px;">${t.noLogs}</div>`
          : filtered.map(
              (entry) => html`
                <div class="log-row">
                  <div class="log-time mono">${formatTime(entry.time)}</div>
                  <div class="log-level ${entry.level ?? ""}">${entry.level ?? ""}</div>
                  <div class="log-subsystem mono">${entry.subsystem ?? ""}</div>
                  <div class="log-message mono">${entry.message ?? entry.raw}</div>
                </div>
              `,
            )}
      </div>
    </section>
  `;
}
