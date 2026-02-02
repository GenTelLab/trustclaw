import { html, nothing } from "lit";
import { icons } from "../icons";

export type PositionProps = {
  connected: boolean;
  selectedPosition: string | null;
  positions: Array<{ id: string; label: string; description?: string }>;
  onPositionChange: (positionId: string | null) => void;
};

export function renderPosition(props: PositionProps) {
  const positions = props.positions || [
    { id: "finance", label: "财务", description: "财务岗位专用配置" },
  ];

  return html`
    <section class="card">
      <h2>岗位配置</h2>
      <p class="muted">选择当前对话使用的岗位，将影响可用的技能和Agent能力。</p>
      
      <div class="form-group">
        <label for="position-select">选择岗位:</label>
        <select
          id="position-select"
          .value=${props.selectedPosition || ""}
          @change=${(e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            props.onPositionChange(value || null);
          }}
        >
          <option value="">无（默认）</option>
          ${positions.map(
            (pos) => html`
              <option value=${pos.id}>${pos.label}</option>
            `,
          )}
        </select>
      </div>

      ${props.selectedPosition
        ? html`
            <div class="callout">
              <strong>当前岗位:</strong> ${positions.find((p) => p.id === props.selectedPosition)?.label || props.selectedPosition}
              ${positions.find((p) => p.id === props.selectedPosition)?.description
                ? html`<div class="muted" style="margin-top: 8px;">${positions.find((p) => p.id === props.selectedPosition)?.description}</div>`
                : nothing}
            </div>
          `
        : nothing}
    </section>

    <section class="card">
      <h3>岗位能力</h3>
      <p class="muted">不同岗位将启用不同的技能和Agent配置。</p>
      <ul>
        ${positions.map(
          (pos) => html`
            <li>
              <strong>${pos.label}</strong>
              ${pos.description ? html`<span class="muted"> - ${pos.description}</span>` : nothing}
            </li>
          `,
        )}
      </ul>
    </section>
  `;
}
