export type VariableMetadata = {
  name: string;
  type: "continuous" | "nominal" | "unknown";
  originalLabel?: string;
};

export type WorkspaceDataset = {
  id: string;
  name: string;
  createdAt: number;
  rows: Record<string, unknown>[];
  columns: VariableMetadata[];
};
