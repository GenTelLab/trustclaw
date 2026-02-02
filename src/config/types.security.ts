export type SecurityGatewayConfig = {
  /** 是否启用安全网关 (默认: true) */
  enabled?: boolean;
  /** 安全接口基础URL (SecurityBaseUrl) */
  baseUrl?: string;
  /** 安全接口Token (SecurityToken) */
  token?: string;
  /** 请求超时时间 (毫秒, 默认: 5000) */
  timeoutMs?: number;
};

export type ContentLabelAction = "allow" | "confirm" | "block";

export type ContentLabelPolicy = {
  action: ContentLabelAction;
};

export type ContentAuditConfig = {
  /** 是否启用内容审计 (默认: false) */
  enabled?: boolean;
  /** 内容审计接口URL */
  baseUrl?: string;
  /** 内容审计接口Token */
  token?: string;
  /** 请求超时时间 (毫秒, 默认: 5000) */
  timeoutMs?: number;
  /** 内容标签处理策略 */
  labelConfigs?: {
    normal?: ContentLabelPolicy;
    porn?: ContentLabelPolicy;
    politics?: ContentLabelPolicy;
    violence?: ContentLabelPolicy;
    illegal?: ContentLabelPolicy;
    discrimination?: ContentLabelPolicy;
    unethical?: ContentLabelPolicy;
  };
};

export type SecurityConfig = {
  /** 安全网关配置 */
  gateway?: SecurityGatewayConfig;
  /** 内容审计配置 */
  contentAudit?: ContentAuditConfig;
};
