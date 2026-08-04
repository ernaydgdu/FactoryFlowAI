export type RequestContext = {
  tenantId: string;
  factoryId: string;
  userId: number;
  email: string;
  role: string;
};

export type PlatformCommandRequestBody = {
  commandKey: string;
  payload?: Record<string, unknown>;
};

export type PlatformCommandResultBody = {
  commandKey: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executedAt: string;
};

export const DEFAULT_TENANT_ID = 'kepler-default';
