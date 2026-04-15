import { create } from "zustand";
import type * as React from "react";
import type { VariableMetadata } from "../types/data";

export interface WorkspaceState {
  dataset: Record<string, unknown>[];
  variables: VariableMetadata[];
  activePluginId: string | null;
  modalContent: React.ReactNode | null;
  isModalOpen: boolean;
  theme: "light" | "dark";
  language: string;

  /**
   * Carries the most recent variable activation signal from the
   * SharedVariableList (double-click) into plugin dialogs.
   * `seq` is a monotonically-increasing counter so that even
   * double-clicking the same variable twice triggers a new update.
   */
  lastActivatedVariable: { name: string; seq: number } | null;

  setDataset: (data: Record<string, unknown>[]) => void;
  setVariables: (vars: VariableMetadata[]) => void;
  setActivePlugin: (pluginId: string) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: string) => void;
  activateVariable: (name: string) => void;
}

let _activateSeq = 0;

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  dataset: [],
  variables: [],
  activePluginId: null,
  modalContent: null,
  isModalOpen: false,
  theme: "light",
  language: "en",
  lastActivatedVariable: null,
  setDataset: (data) => set({ dataset: data }),
  setVariables: (vars) => set({ variables: vars }),
  setActivePlugin: (pluginId) => set({ activePluginId: pluginId }),
  openModal: (content) => set({ modalContent: content, isModalOpen: true }),
  closeModal: () => set({ modalContent: null, isModalOpen: false }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  activateVariable: (name) =>
    set({ lastActivatedVariable: { name, seq: ++_activateSeq } }),
}));

export default useWorkspaceStore;
