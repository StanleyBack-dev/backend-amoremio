export type PermissionParams = {
  group: string;
  permission: string;
};

export type FieldNameParams = {
  field: string;
};

export type EntityNameParams = {
  entity: string;
};

export type FormatValueParams = {
  value: string;
};

export type InvalidOptionParams = {
  field: string;
  options: string[];
};

export type RateLimitExceededParams = {
  retryAfterSeconds?: number;
};
