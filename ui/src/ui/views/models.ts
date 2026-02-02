import { html, nothing } from "lit";
import type { Lang, AgentModel, AgentModelsData } from "../storage";
import { icons } from "../icons";

export type ModelsPageProps = {
  data: AgentModelsData;
  editingModelId: string | null;
  editForm: Partial<AgentModel>;
  lang: Lang;
  saving: boolean;
  onAdd: () => void;
  onEdit: (modelId: string) => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: (modelId: string) => void;
  onSetActive: (modelId: string | null) => void;
  onEditFormChange: (field: keyof AgentModel, value: string) => void;
};

// Common model providers
const MODEL_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "moonshot", label: "Moonshot (Kimi)" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "zhipu", label: "智谱 (GLM)" },
  { value: "qwen", label: "通义千问" },
  { value: "baidu", label: "文心一言" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "google", label: "Google AI" },
  { value: "ollama", label: "Ollama (本地)" },
  { value: "custom", label: "自定义" },
];

function getTranslations(lang: Lang) {
  return lang === "zh"
    ? {
        addModel: "添加模型",
        noModels: "暂无模型配置，点击添加按钮创建",
        name: "显示名称",
        provider: "模型提供商",
        modelId: "模型 ID",
        apiKey: "API Key",
        baseUrl: "API 地址 (可选)",
        active: "当前使用",
        setActive: "设为当前",
        edit: "编辑",
        delete: "删除",
        save: "保存",
        cancel: "取消",
        saving: "保存中...",
        updated: "更新时间",
        namePlaceholder: "如: GPT-4 生产环境",
        modelIdPlaceholder: "如: gpt-4, claude-3-opus, moonshot-v1",
        apiKeyPlaceholder: "sk-xxx...",
        baseUrlPlaceholder: "如: https://api.openai.com/v1",
        confirmDelete: "确定要删除此模型配置吗？",
        selectProvider: "选择提供商",
        modelsList: "模型列表",
        modelsListDesc: "管理 Agent 可用的大模型配置",
      }
    : {
        addModel: "Add Model",
        noModels: "No model configurations yet. Click add to create one.",
        name: "Display Name",
        provider: "Model Provider",
        modelId: "Model ID",
        apiKey: "API Key",
        baseUrl: "API URL (optional)",
        active: "Active",
        setActive: "Set Active",
        edit: "Edit",
        delete: "Delete",
        save: "Save",
        cancel: "Cancel",
        saving: "Saving...",
        updated: "Updated",
        namePlaceholder: "e.g., GPT-4 Production",
        modelIdPlaceholder: "e.g., gpt-4, claude-3-opus, moonshot-v1",
        apiKeyPlaceholder: "sk-xxx...",
        baseUrlPlaceholder: "e.g., https://api.openai.com/v1",
        confirmDelete: "Are you sure you want to delete this model configuration?",
        selectProvider: "Select Provider",
        modelsList: "Model List",
        modelsListDesc: "Manage available LLM configurations for Agent",
      };
}

function formatDate(timestamp: number, lang: Lang): string {
  const date = new Date(timestamp);
  return date.toLocaleString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "****";
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}

function getProviderLabel(provider: string): string {
  const found = MODEL_PROVIDERS.find((p) => p.value === provider);
  return found?.label || provider;
}

function renderEditForm(props: ModelsPageProps, t: ReturnType<typeof getTranslations>) {
  const { editForm, saving, onEditFormChange, onSave, onCancelEdit } = props;

  return html`
    <div class="models-form card">
      <div class="models-form__grid">
        <div class="field">
          <span>${t.name}</span>
          <input
            type="text"
            value=${editForm.name ?? ""}
            @input=${(e: Event) => onEditFormChange("name", (e.target as HTMLInputElement).value)}
            placeholder=${t.namePlaceholder}
          />
        </div>
        <div class="field">
          <span>${t.provider}</span>
          <select
            @change=${(e: Event) => onEditFormChange("provider", (e.target as HTMLSelectElement).value)}
          >
            <option value="" ?selected=${!editForm.provider}>${t.selectProvider}</option>
            ${MODEL_PROVIDERS.map(
              (p) => html`<option value=${p.value} ?selected=${editForm.provider === p.value}>${p.label}</option>`,
            )}
          </select>
        </div>
        <div class="field">
          <span>${t.modelId}</span>
          <input
            type="text"
            value=${editForm.modelId ?? ""}
            @input=${(e: Event) => onEditFormChange("modelId", (e.target as HTMLInputElement).value)}
            placeholder=${t.modelIdPlaceholder}
          />
        </div>
        <div class="field">
          <span>${t.apiKey}</span>
          <input
            type="password"
            value=${editForm.apiKey ?? ""}
            @input=${(e: Event) => onEditFormChange("apiKey", (e.target as HTMLInputElement).value)}
            placeholder=${t.apiKeyPlaceholder}
            autocomplete="off"
          />
        </div>
        <div class="field field--wide">
          <span>${t.baseUrl}</span>
          <input
            type="text"
            value=${editForm.baseUrl ?? ""}
            @input=${(e: Event) => onEditFormChange("baseUrl", (e.target as HTMLInputElement).value)}
            placeholder=${t.baseUrlPlaceholder}
          />
        </div>
      </div>
      <div class="models-form__actions">
        <button class="btn" @click=${onCancelEdit} ?disabled=${saving}>
          ${t.cancel}
        </button>
        <button class="btn primary" @click=${onSave} ?disabled=${saving}>
          ${saving ? t.saving : t.save}
        </button>
      </div>
    </div>
  `;
}

function renderModelCard(
  model: AgentModel,
  props: ModelsPageProps,
  t: ReturnType<typeof getTranslations>,
) {
  const { data, editingModelId, onEdit, onDelete, onSetActive, lang } = props;
  const isActive = data.activeModelId === model.id;
  const isEditing = editingModelId === model.id;

  if (isEditing) {
    return renderEditForm(props, t);
  }

  return html`
    <div class="models-card card ${isActive ? "models-card--active" : ""}">
      <div class="models-card__header">
        <div class="models-card__title">
          <span class="models-card__name">${model.name}</span>
          ${isActive ? html`<span class="pill primary">${t.active}</span>` : nothing}
        </div>
        <div class="models-card__provider">${getProviderLabel(model.provider)}</div>
      </div>
      <div class="models-card__body">
        <div class="models-card__row">
          <span class="models-card__label">${t.modelId}:</span>
          <code class="models-card__value">${model.modelId || "-"}</code>
        </div>
        <div class="models-card__row">
          <span class="models-card__label">${t.apiKey}:</span>
          <code class="models-card__value">${maskApiKey(model.apiKey)}</code>
        </div>
        ${model.baseUrl
          ? html`
              <div class="models-card__row">
                <span class="models-card__label">${t.baseUrl}:</span>
                <code class="models-card__value models-card__value--truncate">${model.baseUrl}</code>
              </div>
            `
          : nothing}
        <div class="models-card__row models-card__row--meta">
          <span class="muted">${t.updated}: ${formatDate(model.updatedAt, lang)}</span>
        </div>
      </div>
      <div class="models-card__actions">
        ${!isActive
          ? html`
              <button class="btn btn--sm" @click=${() => onSetActive(model.id)}>
                ${t.setActive}
              </button>
            `
          : nothing}
        <button class="btn btn--sm" @click=${() => onEdit(model.id)}>
          ${icons.edit}
        </button>
        <button
          class="btn btn--sm danger"
          @click=${() => {
            if (confirm(t.confirmDelete)) {
              onDelete(model.id);
            }
          }}
        >
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

export function renderModels(props: ModelsPageProps) {
  const t = getTranslations(props.lang);
  const { data, editingModelId, onAdd } = props;
  const models = data?.models ?? [];
  const isAddingNew = editingModelId === "new";

  return html`
    <div class="models-page">
      <section class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${t.modelsList}</div>
            <div class="card-sub">${t.modelsListDesc}</div>
          </div>
          <button
            class="btn primary"
            @click=${onAdd}
            ?disabled=${editingModelId !== null}
          >
            ${icons.plus} ${t.addModel}
          </button>
        </div>
      </section>

      ${isAddingNew ? renderEditForm(props, t) : nothing}

      ${models.length === 0 && !isAddingNew
        ? html`
            <div class="card">
              <div class="models-empty">
                <p class="muted">${t.noModels}</p>
              </div>
            </div>
          `
        : nothing}

      <div class="models-grid">
        ${models.map((model) => renderModelCard(model, props, t))}
      </div>
    </div>
  `;
}
