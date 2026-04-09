import { ChevronDown, Database, FileSpreadsheet, Trash2, Upload } from "lucide-react";
import * as React from "react";
import type { SharedDatasetPopoverProps } from "@winm2m/react-stats-ui";
import { cn } from "../utils/cn";

type WorkspaceDatasetPopoverProps = SharedDatasetPopoverProps & {
  contentMaxWidth?: string;
  isDark?: boolean;
};

export function WorkspaceDatasetPopover({ contentMaxWidth = "min(420px, 92vw)", className, isDark = false, ...props }: WorkspaceDatasetPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const resolvedName =
    props.selectedDatasetName ?? props.datasets.find((dataset) => dataset.id === props.selectedDatasetId)?.name ?? props.datasets[0]?.name ?? "";

  React.useEffect(() => {
    if (props.autoOpenWhenEmpty && props.datasets.length === 0) {
      setOpen(true);
    }
  }, [props.autoOpenWhenEmpty, props.datasets.length]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", onPointerDown);
    }

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!props.onDropFile) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      props.onDropFile(file);
    }
  };

  const deleteAria = props.labels?.deleteAria ?? ((name: string) => `Delete dataset ${name}`);

  return (
    <section className={cn("relative w-full", className)} ref={popoverRef}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm",
            props.borderlessButton ? "" : isDark ? "border border-slate-700" : "border border-slate-300",
            isDark ? "bg-slate-900 text-slate-100 hover:bg-slate-800" : "bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <Database className="h-4 w-4" />
          <span className="max-w-[220px] truncate" title={resolvedName}>
            {resolvedName || "Select dataset"}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {open ? (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+0.5rem)] z-30 rounded-xl border p-3 shadow-lg",
            isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
          )}
          style={{ width: contentMaxWidth, maxWidth: "100%" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">{props.labels?.title ?? "Datasets"}</div>
            {props.onUploadClick ? (
              <button
                type="button"
                onClick={props.onUploadClick}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                  isDark ? "border border-slate-600 text-slate-100 hover:bg-slate-800" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                {props.labels?.importButton ?? "Import .xlsx"}
              </button>
            ) : null}
          </div>

          {props.datasets.length > 0 ? (
            <div className="mb-3 max-h-56 overflow-auto rounded-lg border border-slate-200">
              <ul className="divide-y divide-slate-100">
                {props.datasets.map((dataset) => {
                  const active = props.selectedDatasetId === dataset.id;
                  return (
                    <li key={dataset.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          props.onSelect(dataset.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm",
                          active
                            ? isDark
                              ? "bg-slate-800 text-slate-100"
                              : "bg-sky-100 text-sky-700"
                            : isDark
                              ? "hover:bg-slate-800"
                              : "hover:bg-slate-50"
                        )}
                      >
                        <FileSpreadsheet className="h-4 w-4 shrink-0" />
                        <span className="truncate">{dataset.name}</span>
                      </button>
                      {props.onDelete ? (
                        <button
                          type="button"
                          onClick={() => props.onDelete?.(dataset.id)}
                          className={cn(
                            "rounded p-1",
                            isDark ? "text-slate-400 hover:bg-red-950 hover:text-red-400" : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                          )}
                          aria-label={deleteAria(dataset.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : props.labels?.emptyList ? (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{props.labels.emptyList}</div>
          ) : null}

          {props.onDropFile ? (
            <div
              className={cn(
                "rounded-lg border border-dashed px-3 py-4 text-center text-xs text-slate-500 transition",
                dragActive
                  ? isDark
                    ? "border-slate-500 bg-slate-800 text-slate-100"
                    : "border-sky-400 bg-sky-50 text-sky-700"
                  : "border-slate-300"
              )}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              {props.labels?.dropHint ?? "Drop a dataset (.xlsx)"}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
