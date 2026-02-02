import type { JSONSchemaType } from "ajv";

export type DingtalkAccountConfig = {
  enabled?: boolean;
  name?: string;
  appKey?: string;
  appSecret?: string;
  webhookPath?: string;
  dmPolicy?: "pairing" | "allowlist" | "open" | "disabled";
  groupPolicy?: "open" | "disabled" | "allowlist";
  allowFrom?: string[];
};

export const DingtalkConfigSchema: JSONSchemaType<DingtalkAccountConfig> = {
  type: "object",
  properties: {
    enabled: { type: "boolean", nullable: true },
    name: { type: "string", nullable: true },
    appKey: { type: "string", nullable: true },
    appSecret: { type: "string", nullable: true },
    webhookPath: { type: "string", nullable: true },
    dmPolicy: {
      type: "string",
      enum: ["pairing", "allowlist", "open", "disabled"],
      nullable: true,
    },
    groupPolicy: {
      type: "string",
      enum: ["open", "disabled", "allowlist"],
      nullable: true,
    },
    allowFrom: {
      type: "array",
      items: { type: "string" },
      nullable: true,
    },
  },
  additionalProperties: false,
};
