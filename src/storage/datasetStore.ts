import type { WorkspaceDataset } from "../types/data";

const DB_NAME = "react-data-workspace-db";
const DB_VERSION = 1;
const STORE_NAME = "datasets";
const indexedDbFactory = typeof globalThis !== "undefined" ? (globalThis as typeof globalThis & { indexedDB?: IDBFactory }).indexedDB : undefined;
const memoryStore: WorkspaceDataset[] = [];

function openDb(): Promise<IDBDatabase> {
  if (!indexedDbFactory) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDbFactory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = run(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStoredDatasets(): Promise<WorkspaceDataset[]> {
  if (!indexedDbFactory) {
    return [...memoryStore].sort((a, b) => b.createdAt - a.createdAt);
  }
  const records = await withStore<WorkspaceDataset[]>("readonly", (store) => store.getAll());
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveDataset(dataset: WorkspaceDataset): Promise<void> {
  if (!indexedDbFactory) {
    const existingIndex = memoryStore.findIndex((entry) => entry.id === dataset.id);
    if (existingIndex >= 0) {
      memoryStore[existingIndex] = dataset;
    } else {
      memoryStore.push(dataset);
    }
    return;
  }
  await withStore("readwrite", (store) => store.put(dataset));
}

export async function deleteDataset(id: string): Promise<void> {
  if (!indexedDbFactory) {
    const index = memoryStore.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      memoryStore.splice(index, 1);
    }
    return;
  }
  await withStore("readwrite", (store) => store.delete(id));
}
