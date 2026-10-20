import type { ReactNode } from "react";

export type UISlot = "GLOBAL_OVERLAY" | "DATASET_HEADER";

export interface WorkspacePlugin {
  id: string;
  name: string;
  icon?: ReactNode;
  renderView?: () => ReactNode;
  /**
   * The view manages its own height and scrolling.
   *
   * By default a plugin view is wrapped in `min-h-full`: it fills the area and
   * is free to grow past it, and the workspace scrolls. That suits a view that
   * is one long document.
   *
   * It does not suit a view that is itself a split layout. The statistics
   * workbench puts variables above results; when its wrapper grows, the
   * variable list grows with it instead of scrolling inside its pane, and the
   * results end up below the fold. Those views want to be told how much room
   * they have, which is what this does -- the wrapper becomes exactly `h-full`
   * and everything inside resolves against a known height.
   */
  fitsViewport?: boolean;
  uiExtensions?: Array<{
    slot: UISlot;
    render: () => ReactNode;
  }>;
  capabilities?: {
    onVariableActivate?: (variableName: string) => void;
    onVariableSelect?: (variableName: string) => void;
  };
}
