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

  setDataset: (data: Record<string, unknown>[]) => void;
  setVariables: (vars: VariableMetadata[]) => void;
  setActivePlugin: (pluginId: string) => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  dataset: [],
  variables: [],
  activePluginId: null,
  modalContent: null,
  isModalOpen: false,
  theme: "light",
  language: "en",
  setDataset: (data) => set({ dataset: data }),
  setVariables: (vars) => set({ variables: vars }),
  setActivePlugin: (pluginId) => set({ activePluginId: pluginId }),
  openModal: (content) => set({ modalContent: content, isModalOpen: true }),
  closeModal: () => set({ modalContent: null, isModalOpen: false }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language })
}));

export default useWorkspaceStore;
