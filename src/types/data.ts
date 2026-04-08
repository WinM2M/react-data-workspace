export type VariableMetadata = {
  name: string;
  type: "continuous" | "nominal" | "unknown";
};

export type WorkspaceDataset = {
  id: string;
  name: string;
  createdAt: number;
  rows: Record<string, unknown>[];
  columns: VariableMetadata[];
};
