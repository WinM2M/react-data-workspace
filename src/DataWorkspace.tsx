import * as React from "react";
import { I18nextProvider } from "react-i18next";
import { StatsWorkbench, type StatsWorkbenchControl } from "@winm2m/react-stats-ui";
import { BarChart3 } from "lucide-react";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import { initWorkspaceI18n, SUPPORTED_LANGUAGES } from "./i18n";
import { useWorkspaceStore } from "./store/useWorkspaceStore";
import type { WorkspacePlugin } from "./types/plugin";
import { cn } from "./utils/cn";
import type { WorkspaceDataset } from "./types/data";
import { parseDatasetFile } from "./utils/dataset";
import { deleteDataset, getStoredDatasets, saveDataset } from "./storage/datasetStore";
import "./styles/tailwind.css";

const i18nInstance = initWorkspaceI18n();

const languageOptions = SUPPORTED_LANGUAGES.map((lang) => ({ value: lang, label: lang.toUpperCase() }));

export interface DataWorkspaceProps {
  initialData?: Record<string, unknown>[];
  plugins: WorkspacePlugin[];
  showDatasetPopover?: boolean;
  showThemeToggle?: boolean;
  defaultTheme?: "light" | "dark";
  defaultLanguage?: string;
  derivedNames?: Set<string>;
  onDeleteVariable?: (name: string) => void;
}

function useWorkspaceSnapshot() {
  const dataset = useWorkspaceStore((state) => state.dataset);
  const variables = useWorkspaceStore((state) => state.variables);
  const theme = useWorkspaceStore((state) => state.theme);
  const language = useWorkspaceStore((state) => state.language);
  const activePluginId = useWorkspaceStore((state) => state.activePluginId);
  const modalContent = useWorkspaceStore((state) => state.modalContent);
  const isModalOpen = useWorkspaceStore((state) => state.isModalOpen);
  return { dataset, variables, theme, language, activePluginId, modalContent, isModalOpen };
}

type StatsWorkbenchPluginOptions = {
  id?: string;
  name?: string;
  icon?: React.ReactNode;
};

export function createStatsWorkbenchPlugin(options: StatsWorkbenchPluginOptions = {}): WorkspacePlugin {
  const workbenchRef = React.createRef<StatsWorkbenchControl>();

  function StatsWorkbenchBridge() {
    const dataset = useWorkspaceStore((state) => state.dataset);
    const variables = useWorkspaceStore((state) => state.variables);
    const currentTheme = useWorkspaceStore((state) => state.theme);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
      const timer = setTimeout(() => setReady(true), 0);
      return () => clearTimeout(timer);
    }, []);

    React.useEffect(() => {
      if (!ready || !dataset.length) {
        return;
      }
      workbenchRef.current?.injectData({
        id: "workspace-plugin-dataset",
        name: options.name ?? "Workspace dataset",
        rows: dataset,
        columns: variables
      });
    }, [dataset, variables, ready]);

    return ready ? (
      <div className={cn("h-full w-full overflow-auto", currentTheme === "dark" && "dark bg-slate-950 text-slate-100")}> 
        <StatsWorkbench
          ref={workbenchRef}
          hideInternalVariableList
          showDatasetPopover={false}
          className="h-full w-full"
          data-theme={currentTheme}
        />
      </div>
    ) : null;
  }

  return {
    id: options.id ?? "stats-workbench",
    name: options.name ?? "Stats",
    icon: options.icon ?? <BarChart3 className="h-4 w-4" />,
    renderView: () => <StatsWorkbenchBridge />,
    capabilities: {
      onVariableActivate: (variableName: string) => workbenchRef.current?.assignVariableToBestRole(variableName),
      onVariableSelect: (variableName: string) => workbenchRef.current?.assignVariableToBestRole(variableName)
    }
  };
}

export function DataWorkspace({
  initialData = [],
  plugins,
  showDatasetPopover = true,
  showThemeToggle = true,
  defaultTheme = "light",
  defaultLanguage = "en",
  derivedNames,
  onDeleteVariable
}: DataWorkspaceProps) {
  const { dataset, variables, theme, language, activePluginId, modalContent, isModalOpen } = useWorkspaceSnapshot();
  const setDataset = useWorkspaceStore((state) => state.setDataset);
  const setVariables = useWorkspaceStore((state) => state.setVariables);
  const setActivePlugin = useWorkspaceStore((state) => state.setActivePlugin);
  const setTheme = useWorkspaceStore((state) => state.setTheme);
  const setLanguage = useWorkspaceStore((state) => state.setLanguage);
  const closeModal = useWorkspaceStore((state) => state.closeModal);
  const openModal = useWorkspaceStore((state) => state.openModal);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [availableDatasets, setAvailableDatasets] = React.useState<WorkspaceDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = React.useState<string | null>(null);
  const [selectedVariable, setSelectedVariable] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const syncDatasets = async () => {
      const stored = await getStoredDatasets();
      if (cancelled) {
        return;
      }
      setAvailableDatasets(stored);
      setSelectedDatasetId((prev) => {
        if (prev && stored.some((dataset) => dataset.id === prev)) {
          return prev;
        }
        return stored[0]?.id ?? null;
      });
    };
    void syncDatasets();
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const selectedDataset = React.useMemo(
    () => availableDatasets.find((entry) => entry.id === selectedDatasetId) ?? null,
    [availableDatasets, selectedDatasetId]
  );

  // Track which dataset ID has been seeded into the Zustand store.
  // We only overwrite the store from IndexedDB when the selected dataset ID
  // changes (user picks a different dataset) or on first load.
  // This prevents computed/transformed variables from being wiped out
  // when the selectedDataset reference changes due to re-fetching.
  const seededDatasetIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selectedDataset) {
      setDataset([]);
      setVariables([]);
      seededDatasetIdRef.current = null;
      return;
    }
    // Only seed from IndexedDB if this is a different dataset than what we already seeded
    if (seededDatasetIdRef.current === selectedDataset.id) {
      return;
    }
    setDataset(selectedDataset.rows);
    setVariables(selectedDataset.columns);
    seededDatasetIdRef.current = selectedDataset.id;
  }, [selectedDataset, setDataset, setVariables]);

  // Auto-persist Zustand store dataset/variables back to IndexedDB when they
  // change (e.g. after a transform operation adds computed variables).
  // Uses a debounce to avoid excessive writes.
  const persistTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!seededDatasetIdRef.current || !dataset.length) {
      return;
    }
    // Skip persistence if this is the initial seed (values match selectedDataset)
    if (
      selectedDataset &&
      dataset === selectedDataset.rows &&
      variables === selectedDataset.columns
    ) {
      return;
    }
    const datasetId = seededDatasetIdRef.current;

    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      const target = availableDatasets.find((d) => d.id === datasetId);
      if (!target) return;
      const updated: WorkspaceDataset = {
        ...target,
        rows: dataset,
        columns: variables,
      };
      void saveDataset(updated).then(() => {
        setAvailableDatasets((prev) =>
          prev.map((d) => (d.id === datasetId ? updated : d))
        );
      });
    }, 300);

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, [dataset, variables]);

  React.useEffect(() => {
    setSelectedVariable(null);
  }, [selectedDatasetId]);

  React.useEffect(() => {
    setTheme(defaultTheme);
  }, [defaultTheme, setTheme]);

  React.useEffect(() => {
    setLanguage(defaultLanguage);
    void i18nInstance.changeLanguage(defaultLanguage);
  }, [defaultLanguage, setLanguage]);

  const resolvedPlugins = React.useMemo(() => (plugins.length ? plugins : [createStatsWorkbenchPlugin()]), [plugins]);

  React.useEffect(() => {
    if (resolvedPlugins.length === 0) {
      return;
    }
    if (!activePluginId) {
      setActivePlugin(resolvedPlugins[0].id);
    }
  }, [activePluginId, resolvedPlugins, setActivePlugin]);

  const handleToggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const handleLanguageChange = React.useCallback(
    (next: string) => {
      setLanguage(next);
      void i18nInstance.changeLanguage(next);
    },
    [setLanguage]
  );

  const importDataset = React.useCallback(
    async (file: File) => {
      try {
        const datasetRecord = await parseDatasetFile(file);
        await saveDataset(datasetRecord);
        setAvailableDatasets((prev) => {
          const next = [datasetRecord, ...prev.filter((entry) => entry.id !== datasetRecord.id)];
          return next.sort((a, b) => b.createdAt - a.createdAt);
        });
        setSelectedDatasetId(datasetRecord.id);
      } catch (error) {
        openModal(
          <div>
            <h2 className="text-lg font-semibold text-red-600">Import failed</h2>
            <p className="text-sm text-slate-600">{error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        );
      }
    },
    [openModal]
  );

  const handleFileInput = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      await importDataset(file);
      event.target.value = "";
    },
    [importDataset]
  );

  const handleDropDataset = React.useCallback(
    async (file: File) => {
      await importDataset(file);
    },
    [importDataset]
  );

  const handleDeleteDataset = React.useCallback(
    async (id: string) => {
      await deleteDataset(id);
      const remaining = availableDatasets.filter((entry) => entry.id !== id);
      setAvailableDatasets(remaining);
      setSelectedDatasetId((current) => {
        if (current && remaining.some((entry) => entry.id === current)) {
          return current;
        }
        return remaining[0]?.id ?? null;
      });
    },
    [availableDatasets]
  );

  const activePlugin = React.useMemo(() => resolvedPlugins.find((plugin) => plugin.id === activePluginId) ?? resolvedPlugins[0] ?? null, [activePluginId, resolvedPlugins]);

  const handleVariableActivate = React.useCallback(
    (variableName: string) => {
      setSelectedVariable(variableName);
      activePlugin?.capabilities?.onVariableActivate?.(variableName);
    },
    [activePlugin]
  );

  const workspaceRootClass = React.useMemo(() => cn("h-full w-full", theme === "dark" && "dark"), [theme]);

  return (
    <I18nextProvider i18n={i18nInstance}>
      <div className={workspaceRootClass}>
        <WorkspaceLayout
          plugins={resolvedPlugins}
          activePluginId={activePlugin?.id ?? null}
          onSelectPlugin={setActivePlugin}
          variables={variables}
          selectedVariableName={selectedVariable}
          onSelectVariable={setSelectedVariable}
          onActivateVariable={handleVariableActivate}
          datasets={availableDatasets}
          selectedDatasetId={selectedDatasetId}
          onSelectDataset={setSelectedDatasetId}
          onUploadDataset={() => fileInputRef.current?.click()}
          onDropDataset={handleDropDataset}
          fileInputRef={fileInputRef}
          onFileInput={handleFileInput}
          onDeleteDataset={handleDeleteDataset}
          showDatasetPopover={showDatasetPopover}
          showThemeToggle={showThemeToggle}
          derivedNames={derivedNames}
          onDeleteVariable={onDeleteVariable}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          language={language}
          languages={languageOptions}
          onLanguageChange={handleLanguageChange}
          isModalOpen={isModalOpen}
          modalContent={modalContent}
          closeModal={closeModal}
        />
      </div>
    </I18nextProvider>
  );
}
