import { html, nothing } from "lit";

import { clampText } from "../format";
import type { SkillStatusEntry, SkillStatusReport } from "../types";
import type { SkillMessageMap } from "../controllers/skills";
import type { Lang } from "../storage";
import { getSection } from "../i18n";

// Game Code skill 专用配置
export type GameCodeConfig = {
  outputDir: string;
  mode: "template" | "ai";
  gameType: string;
  title: string;
  prompt: string;
  model: string;
  apiKey: string;
};

export type GameCodeState = {
  config: GameCodeConfig;
  running: boolean;
  output: string;
  error: string | null;
  success: boolean;
};

export type SkillsProps = {
  loading: boolean;
  report: SkillStatusReport | null;
  error: string | null;
  filter: string;
  edits: Record<string, string>;
  busyKey: string | null;
  messages: SkillMessageMap;
  lang: Lang;
  // Game Code 专用
  gameCode?: GameCodeState;
  onFilterChange: (next: string) => void;
  onRefresh: () => void;
  onToggle: (skillKey: string, enabled: boolean) => void;
  onEdit: (skillKey: string, value: string) => void;
  onSaveKey: (skillKey: string) => void;
  onInstall: (skillKey: string, name: string, installId: string) => void;
  // Game Code 专用
  onGameCodeConfigChange?: (config: Partial<GameCodeConfig>) => void;
  onGameCodeRun?: () => void;
  onGameCodeStop?: () => void;
};

export function renderSkills(props: SkillsProps) {
  const lang = props.lang || "en";
  const t = getSection(lang, "skills");
  const tc = getSection(lang, "common");
  
  const skills = props.report?.skills ?? [];
  const filter = props.filter.trim().toLowerCase();
  const filtered = filter
    ? skills.filter((skill) =>
        [skill.name, skill.description, skill.source]
          .join(" ")
          .toLowerCase()
          .includes(filter),
      )
    : skills;

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

      <div class="filters" style="margin-top: 14px;">
        <label class="field" style="flex: 1;">
          <span>${tc.filter}</span>
          <input
            .value=${props.filter}
            @input=${(e: Event) =>
              props.onFilterChange((e.target as HTMLInputElement).value)}
            placeholder="${t.searchSkills}"
          />
        </label>
        <div class="muted">${filtered.length} ${lang === "zh" ? "显示" : "shown"}</div>
      </div>

      ${props.error
        ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
        : nothing}

      ${filtered.length === 0
        ? html`<div class="muted" style="margin-top: 16px;">${t.noSkills}</div>`
        : html`
            <div class="list" style="margin-top: 16px;">
              ${filtered.map((skill) => renderSkill(skill, props, lang))}
            </div>
          `}
    </section>
  `;
}

// 渲染 Game Code 专用执行面板
function renderGameCodePanel(skill: SkillStatusEntry, props: SkillsProps, lang: Lang) {
  const gc = props.gameCode;
  if (!gc || !props.onGameCodeConfigChange) return nothing;
  
  const isZh = lang === "zh";
  const config = gc.config;
  const isAiMode = config.mode === "ai";
  
  return html`
    <div class="skill-exec-panel" style="margin-top: 16px; padding: 16px; background: var(--surface-alt, #f5f5f5); border-radius: 8px; border-left: 4px solid var(--primary-color, #4ecca3);">
      <div style="font-weight: 600; margin-bottom: 12px; color: var(--text-color);">
        🎮 ${isZh ? "快速执行" : "Quick Execute"}
      </div>
      
      <!-- 输出目录 -->
      <div class="field" style="margin-bottom: 12px;">
        <span>${isZh ? "输出目录" : "Output Directory"}</span>
        <input
          type="text"
          .value=${config.outputDir}
          @input=${(e: Event) => props.onGameCodeConfigChange?.({ outputDir: (e.target as HTMLInputElement).value })}
          placeholder=${isZh ? "例如: D:\\games\\my-game" : "e.g. D:\\games\\my-game"}
          style="width: 100%;"
        />
      </div>
      
      <!-- 模式选择 -->
      <div class="field" style="margin-bottom: 12px;">
        <span>${isZh ? "生成模式" : "Mode"}</span>
        <select
          .value=${config.mode}
          @change=${(e: Event) => props.onGameCodeConfigChange?.({ mode: (e.target as HTMLSelectElement).value as "template" | "ai" })}
          style="width: 100%;"
        >
          <option value="template">${isZh ? "模板模式 (快速生成经典游戏)" : "Template Mode (Classic Games)"}</option>
          <option value="ai">${isZh ? "AI模式 (自定义游戏需求)" : "AI Mode (Custom Games)"}</option>
        </select>
      </div>
      
      ${isAiMode ? html`
        <!-- AI 模式选项 -->
        <div class="field" style="margin-bottom: 12px;">
          <span>${isZh ? "游戏需求描述" : "Game Description"}</span>
          <textarea
            .value=${config.prompt}
            @input=${(e: Event) => props.onGameCodeConfigChange?.({ prompt: (e.target as HTMLTextAreaElement).value })}
            placeholder=${isZh ? "例如: 创建一个太空射击游戏，玩家控制飞船躲避陨石" : "e.g. Create a space shooter game..."}
            style="width: 100%; min-height: 60px; resize: vertical;"
          ></textarea>
        </div>
        <div class="row" style="gap: 12px; margin-bottom: 12px;">
          <div class="field" style="flex: 1;">
            <span>${isZh ? "AI模型" : "AI Model"}</span>
            <select
              .value=${config.model}
              @change=${(e: Event) => props.onGameCodeConfigChange?.({ model: (e.target as HTMLSelectElement).value })}
              style="width: 100%;"
            >
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="glm-4">GLM-4 (智谱AI)</option>
              <option value="deepseek-chat">DeepSeek</option>
            </select>
          </div>
          <div class="field" style="flex: 1;">
            <span>API Key</span>
            <input
              type="password"
              .value=${config.apiKey}
              @input=${(e: Event) => props.onGameCodeConfigChange?.({ apiKey: (e.target as HTMLInputElement).value })}
              placeholder=${isZh ? "留空使用环境变量" : "Leave empty for env var"}
              style="width: 100%;"
            />
          </div>
        </div>
      ` : html`
        <!-- 模板模式选项 -->
        <div class="row" style="gap: 12px; margin-bottom: 12px;">
          <div class="field" style="flex: 1;">
            <span>${isZh ? "游戏类型" : "Game Type"}</span>
            <select
              .value=${config.gameType}
              @change=${(e: Event) => props.onGameCodeConfigChange?.({ gameType: (e.target as HTMLSelectElement).value })}
              style="width: 100%;"
            >
              <option value="snake">🐍 ${isZh ? "贪吃蛇" : "Snake"}</option>
              <option value="tetris">🧱 ${isZh ? "俄罗斯方块" : "Tetris"}</option>
              <option value="breakout">🎯 ${isZh ? "打砖块" : "Breakout"}</option>
              <option value="pong">🏓 ${isZh ? "乒乓球" : "Pong"}</option>
              <option value="flappy">🐦 ${isZh ? "跳跃小鸟" : "Flappy Bird"}</option>
              <option value="memory">🃏 ${isZh ? "记忆翻牌" : "Memory"}</option>
            </select>
          </div>
          <div class="field" style="flex: 1;">
            <span>${isZh ? "游戏标题 (可选)" : "Title (optional)"}</span>
            <input
              type="text"
              .value=${config.title}
              @input=${(e: Event) => props.onGameCodeConfigChange?.({ title: (e.target as HTMLInputElement).value })}
              placeholder=${isZh ? "我的小游戏" : "My Game"}
              style="width: 100%;"
            />
          </div>
        </div>
      `}
      
      <!-- 执行按钮 -->
      <div class="row" style="gap: 8px; margin-top: 16px;">
        <button
          class="btn primary"
          ?disabled=${gc.running || !config.outputDir}
          @click=${props.onGameCodeRun}
        >
          ${gc.running ? (isZh ? "⏳ 生成中..." : "⏳ Generating...") : (isZh ? "▶️ 执行" : "▶️ Run")}
        </button>
        ${gc.running ? html`
          <button class="btn" @click=${props.onGameCodeStop}>
            ${isZh ? "⏹️ 停止" : "⏹️ Stop"}
          </button>
        ` : nothing}
      </div>
      
      <!-- 输出显示 -->
      ${gc.output || gc.error ? html`
        <div style="margin-top: 16px; padding: 12px; background: #1e1e1e; border-radius: 4px; font-family: monospace; font-size: 13px; max-height: 200px; overflow-y: auto;">
          ${gc.error ? html`<div style="color: #f48771;">${gc.error}</div>` : nothing}
          ${gc.output ? html`<div style="color: ${gc.success ? '#4ecca3' : '#d4d4d4'}; white-space: pre-wrap;">${gc.output}</div>` : nothing}
        </div>
      ` : nothing}
      
      ${gc.success ? html`
        <div class="callout" style="margin-top: 12px; background: rgba(78, 204, 163, 0.15); border-left: 4px solid #4ecca3;">
          ✅ ${isZh ? "游戏生成成功！用浏览器打开输出目录中的 index.html 即可游玩" : "Game generated! Open index.html in browser to play"}
        </div>
      ` : nothing}
    </div>
  `;
}

function renderSkill(skill: SkillStatusEntry, props: SkillsProps, lang: Lang) {
  const t = getSection(lang, "skills");
  
  const busy = props.busyKey === skill.skillKey;
  const apiKey = props.edits[skill.skillKey] ?? "";
  const message = props.messages[skill.skillKey] ?? null;
  const canInstall =
    skill.install.length > 0 && skill.missing.bins.length > 0;
  const missing = [
    ...skill.missing.bins.map((b) => `bin:${b}`),
    ...skill.missing.env.map((e) => `env:${e}`),
    ...skill.missing.config.map((c) => `config:${c}`),
    ...skill.missing.os.map((o) => `os:${o}`),
  ];
  const reasons: string[] = [];
  if (skill.disabled) reasons.push(lang === "zh" ? "已禁用" : "disabled");
  if (skill.blockedByAllowlist) reasons.push(lang === "zh" ? "被允许列表阻止" : "blocked by allowlist");
  
  // 检查是否是 game-code skill
  const isGameCode = skill.name === "game-code" && skill.eligible;
  
  return html`
    <div class="list-item">
      <div class="list-main">
        <div class="list-title">
          ${skill.emoji ? `${skill.emoji} ` : ""}${skill.name}
        </div>
        <div class="list-sub">${clampText(skill.description, 140)}</div>
        <div class="chip-row" style="margin-top: 6px;">
          <span class="chip">${skill.source}</span>
          <span class="chip ${skill.eligible ? "chip-ok" : "chip-warn"}">
            ${skill.eligible ? (lang === "zh" ? "符合条件" : "eligible") : (lang === "zh" ? "已阻止" : "blocked")}
          </span>
          ${skill.disabled ? html`<span class="chip chip-warn">${t.disabled}</span>` : nothing}
        </div>
        ${missing.length > 0
          ? html`
              <div class="muted" style="margin-top: 6px;">
                ${lang === "zh" ? "缺失" : "Missing"}: ${missing.join(", ")}
              </div>
            `
          : nothing}
        ${reasons.length > 0
          ? html`
              <div class="muted" style="margin-top: 6px;">
                ${lang === "zh" ? "原因" : "Reason"}: ${reasons.join(", ")}
              </div>
            `
          : nothing}
      </div>
      <div class="list-meta">
        <div class="row" style="justify-content: flex-end; flex-wrap: wrap;">
          <button
            class="btn"
            ?disabled=${busy}
            @click=${() => props.onToggle(skill.skillKey, skill.disabled)}
          >
            ${skill.disabled ? t.enable : t.disable}
          </button>
          ${canInstall
            ? html`<button
                class="btn"
                ?disabled=${busy}
                @click=${() =>
                  props.onInstall(skill.skillKey, skill.name, skill.install[0].id)}
              >
                ${busy ? (lang === "zh" ? "安装中…" : "Installing…") : skill.install[0].label}
              </button>`
            : nothing}
        </div>
        ${message
          ? html`<div
              class="muted"
              style="margin-top: 8px; color: ${
                message.kind === "error"
                  ? "var(--danger-color, #d14343)"
                  : "var(--success-color, #0a7f5a)"
              };"
            >
              ${message.message}
            </div>`
          : nothing}
        ${skill.primaryEnv
          ? html`
              <div class="field" style="margin-top: 10px;">
                <span>${t.apiKey}</span>
                <input
                  type="password"
                  .value=${apiKey}
                  @input=${(e: Event) =>
                    props.onEdit(skill.skillKey, (e.target as HTMLInputElement).value)}
                />
              </div>
              <button
                class="btn primary"
                style="margin-top: 8px;"
                ?disabled=${busy}
                @click=${() => props.onSaveKey(skill.skillKey)}
              >
                ${t.setApiKey}
              </button>
            `
          : nothing}
      </div>
      ${isGameCode ? renderGameCodePanel(skill, props, lang) : nothing}
    </div>
  `;
}
