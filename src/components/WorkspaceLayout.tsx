import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronUp, Moon, Settings, Sun, X } from "lucide-react";
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
  showThemeToggle?: boolean;
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

/**
 * Stable wrapper for a plugin's renderView() output.
 * Calls renderView() once and caches the result so the component tree
 * is never torn down / re-mounted across renders.
 */
function PluginViewSlot({ plugin }: { plugin: WorkspacePlugin }) {
  const content = React.useMemo(() => plugin.renderView?.() ?? null, [plugin]);
  return <>{content}</>;
}

function variableTypeLabel(type: VariableMeta["type"]): string {
  if (type === "continuous") return "C";
  if (type === "nominal") return "N";
  return "?";
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
  showThemeToggle = true,
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
  const [isMobileVariableOpen, setIsMobileVariableOpen] = React.useState(false);

  const renderVariablePanel = React.useCallback(
    (mobile = false) => {
      if (showDatasetPopover === false && !selectedDataset) {
        return null;
      }

      return (
        <>
          {showDatasetPopover ? (
            <div className={mobile ? "mb-3" : "mb-4"}>
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
            mobile ? (
              <div className={cn("rounded-xl border p-3", isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white")}>
                <div className="mb-2 text-xs font-semibold text-slate-500">{t("workspace.variablePanel")}</div>
                {variables.length ? (
                  <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3">
                    {variables.map((variable) => {
                      const isSelected = selectedVariableName === variable.name;
                      return (
                        <button
                          key={variable.name}
                          type="button"
                          onClick={() => onSelectVariable?.(variable.name)}
                          onDoubleClick={() => onActivateVariable?.(variable.name)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-left transition",
                            isSelected
                              ? isDark
                                ? "border-sky-500 bg-sky-500/10"
                                : "border-indigo-300 bg-indigo-50"
                              : isDark
                                ? "border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          )}
                          title={variable.name}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold leading-none",
                                variable.type === "continuous"
                                  ? "bg-emerald-500 text-white"
                                  : variable.type === "nominal"
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-400 text-white"
                              )}
                            >
                              {variableTypeLabel(variable.type)}
                            </span>
                            <span className="truncate text-xs font-semibold">{variable.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-slate-500">
                    {t("workspace.noVariable")}
                  </div>
                )}
              </div>
            ) : (
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
            )
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
        </>
      );
    },
    [
      datasets,
      isDark,
      onActivateVariable,
      onDeleteDataset,
      onDropDataset,
      onSelectDataset,
      onSelectVariable,
      onUploadDataset,
      selectedDataset,
      selectedDatasetId,
      selectedVariableName,
      showDatasetPopover,
      t,
      variables,
    ]
  );

  return (
    <Dialog.Root open={isModalOpen} onOpenChange={(open) => (open ? undefined : closeModal())}>
      <div
        className={cn(
          "flex h-full flex-col transition-colors md:flex-row",
          isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
        )}
      >
        <aside
          className={cn(
            "hidden w-16 flex-col border-r md:flex",
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
          {showThemeToggle ? (
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
          ) : null}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          {fileInputRef ? (
            <input ref={fileInputRef} type="file" accept=".xlsx,.json" onChange={onFileInput} hidden />
          ) : null}

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

          <section
            className={cn(
              "border-b px-3 py-3 md:hidden",
              isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
            )}
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {plugins.map((plugin) => {
                const isActive = plugin.id === activePlugin?.id;
                return (
                  <button
                    key={plugin.id}
                    type="button"
                    onClick={() => onSelectPlugin(plugin.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      isActive
                        ? isDark
                          ? "border-slate-100 bg-slate-100 text-slate-900"
                          : "border-slate-900 bg-slate-900 text-white"
                        : isDark
                          ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">
                      {plugin.icon ?? <Settings className="h-3.5 w-3.5" />}
                    </span>
                    <span>{plugin.name}</span>
                  </button>
                );
              })}
              {showThemeToggle ? (
                <button
                  type="button"
                  onClick={() => onToggleTheme()}
                  className={cn(
                    "ml-auto inline-flex shrink-0 items-center justify-center rounded-full border p-1.5",
                    isDark
                      ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  )}
                  aria-label={theme === "dark" ? t("theme.light") : t("theme.dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileVariableOpen((prev) => !prev)}
              className={cn(
                "mt-3 inline-flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold",
                isDark
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              )}
            >
              <span>{t("workspace.variablePanel")}</span>
              {isMobileVariableOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isMobileVariableOpen ? <div className="mt-3">{renderVariablePanel(true)}</div> : null}
          </section>

          <section className={cn("flex min-h-0 flex-1 flex-col md:flex-row md:divide-x", isDark ? "md:divide-slate-800" : "md:divide-slate-200")}>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-hidden p-3 md:p-6",
                isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
              )}
            >
              <div className="h-full min-h-0 overflow-auto">
                {plugins.map((plugin) => {
                  const isActive = plugin.id === activePlugin?.id;
                  return plugin.renderView ? (
                    <div
                      key={plugin.id}
                      className="min-h-full"
                      style={{ display: isActive ? undefined : "none" }}
                    >
                      <PluginViewSlot plugin={plugin} />
                    </div>
                  ) : null;
                })}
                {!activePlugin?.renderView && (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Select a plugin to get started.
                  </div>
                )}
              </div>
            </div>
            <aside
              className={cn(
                "hidden w-80 overflow-auto border-l p-4 md:block",
                isDark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-900"
              )}
            >
              {renderVariablePanel()}
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
