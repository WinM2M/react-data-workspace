import { read, utils } from "xlsx";
import type { VariableMetadata, WorkspaceDataset } from "../types/data";

export function inferVariableType(values: unknown[]): VariableMetadata["type"] {
  const nonEmpty = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "").slice(0, 50);
  if (nonEmpty.length === 0) {
    return "unknown";
  }
  const numeric = nonEmpty.every((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value);
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed);
    }
    return false;
  });
  return numeric ? "continuous" : "nominal";
}

export function buildVariableMetadata(rows: Record<string, unknown>[]): VariableMetadata[] {
  const keys = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
  return Array.from(keys)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      name,
      type: inferVariableType(rows.map((row) => row[name]))
    }));
}

export function createDatasetFromRows(rows: Record<string, unknown>[], name: string, id: string = crypto.randomUUID()): WorkspaceDataset {
  return {
    id,
    name,
    createdAt: Date.now(),
    rows,
    columns: buildVariableMetadata(rows)
  };
}

export async function parseDatasetFile(file: File): Promise<WorkspaceDataset> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json") {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON file must contain an array of objects");
    }
    return createDatasetFromRows(parsed as Record<string, unknown>[], file.name);
  }

  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No worksheet found in file");
  }
  const rows = utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: null });
  return createDatasetFromRows(rows, file.name);
}
