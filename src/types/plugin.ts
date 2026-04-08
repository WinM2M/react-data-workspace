import type { ReactNode } from "react";

export type UISlot = "GLOBAL_OVERLAY" | "DATASET_HEADER";

export interface WorkspacePlugin {
  id: string;
  name: string;
  icon?: ReactNode;
  renderView?: () => ReactNode;
  uiExtensions?: Array<{
    slot: UISlot;
    render: () => ReactNode;
  }>;
  capabilities?: {
    onVariableActivate?: (variableName: string) => void;
    onVariableSelect?: (variableName: string) => void;
  };
}
