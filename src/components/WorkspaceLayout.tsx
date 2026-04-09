import * as Dialog from "@radix-ui/react-dialog";
import { Moon, Settings, Sun, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SharedVariableList } from "@winm2m/react-stats-ui";
import type { WorkspacePlugin, UISlot } from "../types/plugin";
import { cn } from "../utils/cn";
import type { VariableMetadata as VariableMeta, WorkspaceDataset as Dataset } from "../types/data";
import { WorkspaceDatasetPopover } from "./WorkspaceDatasetPopover";

export type LanguageOption = {
  value: string;
  label: string;
};

export type WorkspaceLayoutProps = {
  plugins: WorkspacePlugin[];
  activePluginId: string | null;
  onSelectPlugin: (pluginId: string) => void;
  variables: VariableMeta[];
  selectedVariableName?: string | null;
  onSelectVariable?: (variableName: string) => void;
  onActivateVariable?: (variableName: string) => void;
  datasets: Dataset[];
  selectedDatasetId: string | null;
  onSelectDataset: (datasetId: string) => void;
  onUploadDataset?: () => void;
  onDropDataset?: (file: File) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onFileInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDataset?: (datasetId: string) => void;
  showDatasetPopover?: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  language: string;
  languages: LanguageOption[];
  onLanguageChange: (lang: string) => void;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  closeModal: () => void;
};

function renderExtensions(plugins: WorkspacePlugin[], slot: UISlot) {
  return plugins
    .flatMap((plugin) => plugin.uiExtensions?.filter((ext) => ext.slot === slot).map((ext, index) => ({ ext, key: `${plugin.id}-${slot}-${index}` })) ?? [])
    .map(({ ext, key }) => (
      <React.Fragment key={key}>{ext.render()}</React.Fragment>
    ));
}

export function WorkspaceLayout({
  plugins,
  activePluginId,
  onSelectPlugin,
  variables,
  selectedVariableName = null,
  onSelectVariable,
  onActivateVariable,
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onUploadDataset,
  onDropDataset,
  fileInputRef,
  onFileInput,
  onDeleteDataset,
  showDatasetPopover = true,
  theme,
  onToggleTheme,
  language,
  languages,
  onLanguageChange,
  isModalOpen,
  modalContent,
  closeModal
}: WorkspaceLayoutProps) {
  const { t } = useTranslation();
  const activePlugin = React.useMemo(() => plugins.find((plugin) => plugin.id === activePluginId) ?? plugins[0] ?? null, [activePluginId, plugins]);
  const selectedDataset = React.useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0] ?? null,
    [datasets, selectedDatasetId]
  );
  const isDark = theme === "dark";

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(open) => (open ? undefined : closeModal())}>
      <div
        className={cn(
          "flex h-full transition-colors",
          isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
        )}
      >
        <aside
          className={cn(
            "flex w-16 flex-col border-r",
            isDark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
          )}
        >
          <ul className="flex-1 space-y-3 p-2">
            {plugins.map((plugin) => {
              const isActive = plugin.id === activePlugin?.id;
              return (
                <li key={plugin.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlugin(plugin.id)}
                    className={cn(
                      "flex w-full items-center justify-center rounded-2xl p-2 text-[10px] font-semibold transition",
                      isActive
                        ? isDark
                          ? "bg-slate-100 text-slate-900 shadow-lg"
                          : "bg-slate-900 text-white shadow-lg"
                        : isDark
                          ? "text-slate-200 hover:bg-slate-800"
                          : "text-slate-600 hover:bg-slate-100"
                    )}
                    title={plugin.name}
                    aria-label={plugin.name}
                  >
                    <span className="flex h-8 w-8 items-center justify-center">
                      {plugin.icon ?? <Settings className="h-4 w-4" />}
                    </span>
                    <span className="sr-only">{plugin.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={cn("border-t p-3", isDark ? "border-slate-800" : "border-slate-200")}>
            <button
              type="button"
              onClick={() => onToggleTheme()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[10px] font-semibold transition",
                isDark
                  ? "border border-slate-700 text-slate-100 hover:bg-slate-800"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">{theme === "dark" ? t("theme.light") : t("theme.dark")}</span>
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          {plugins.some((plugin) => plugin.uiExtensions?.some((ext) => ext.slot === "DATASET_HEADER")) ? (
            <div
              className={cn(
                "flex items-center gap-4 border-b px-6 py-4",
                isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              )}
            >
              {renderExtensions(plugins, "DATASET_HEADER")}
            </div>
          ) : null}

          <section className={cn("flex min-h-0 flex-1 divide-x", isDark ? "divide-slate-800" : "divide-slate-200")}>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden p-6",
                isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
              )}
            >
              <div className="h-full min-h-0 overflow-auto">
                {activePlugin?.renderView ? (
                  <div className="min-h-full">{activePlugin.renderView()}</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Select a plugin to get started.
                  </div>
                )}
              </div>
            </div>
            <aside
              className={cn(
                "w-80 border-l p-4 overflow-auto",
                isDark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-900"
              )}
            >
              {fileInputRef ? (
                <input ref={fileInputRef} type="file" accept=".xlsx,.json" onChange={onFileInput} hidden />
              ) : null}
              {showDatasetPopover ? (
                <div className="mb-4">
                  <WorkspaceDatasetPopover
                    datasets={datasets}
                    selectedDatasetId={selectedDatasetId}
                    selectedDatasetName={selectedDataset?.name ?? t("dataset.empty")}
                    onSelect={onSelectDataset}
                    onUploadClick={onUploadDataset}
                    onDropFile={onDropDataset}
                    onDelete={onDeleteDataset}
                    className="w-full"
                    contentMaxWidth="min(420px, 100%)"
                    isDark={isDark}
                    labels={{
                      title: t("dataset.title"),
                      importButton: t("dataset.import"),
                      dropHint: t("dataset.dropHint"),
                      deleteAria: (name) => `${t("dataset.title")}: ${name}`
                    }}
                  />
                </div>
              ) : null}
              {selectedDataset ? (
                <SharedVariableList
                  variables={variables}
                  heading={t("workspace.variablePanel")}
                  emptyLabel={t("workspace.noVariable")}
                  selectedName={selectedVariableName}
                  onSelect={(name: string) => onSelectVariable?.(name)}
                  onDoubleClick={(name: string) => onActivateVariable?.(name)}
                  datasetId={selectedDataset?.id ?? null}
                  datasetName={selectedDataset?.name ?? null}
                  borderless
                />
              ) : (
                <div
                  className={cn(
                    "flex h-full flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm",
                    isDark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"
                  )}
                >
                  {t("dataset.empty")}
                </div>
              )}
            </aside>
          </section>
        </main>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full border border-transparent p-1 text-slate-500 hover:border-slate-200 hover:text-slate-700"
            aria-label={t("modal.close")}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mt-2 space-y-4 text-sm text-slate-700 dark:text-slate-100">{modalContent}</div>
          {renderExtensions(plugins, "GLOBAL_OVERLAY")}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
