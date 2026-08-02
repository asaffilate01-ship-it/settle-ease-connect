/**
 * Offline queue backed by IndexedDB.
 *
 * Purpose: keep BeistandPlus usable on shaky or absent connectivity — the case
 * that hurts the most for refugees, camp residents, rural areas and prepaid
 * SIMs. Only the explicitly supported insurance callback request is stored;
 * documents, messages, case notes and other sensitive records are never put
 * in unencrypted browser storage.
 *
 * Public API is intentionally tiny — everything reads/writes via `enqueue`,
 * `listQueue`, `removeItem`, `flushQueue`.
 */

const DB_NAME = "beistandplus-offline";
const DB_VERSION = 1;
const STORE = "queue";

export type OfflineKind = "insurance_callback";

export type InsuranceCallbackOfflinePayload = {
  full_name: string;
  email: string;
  phone: string | null;
  product_line: string;
  preferred_contact: "email" | "phone" | "whatsapp";
  preferred_language: string;
  notes: string | null;
};

export interface OfflineItem<TPayload = unknown> {
  id: string;
  kind: OfflineKind;
  /** Human-readable label shown in the queue UI. */
  label: string;
  /** Endpoint hint — for server functions we replay via the handler map. */
  handler: string;
  payload: TPayload;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

type ReplayHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, ReplayHandler>();

/** Register how to replay a queued item once the network returns. */
export function registerReplayHandler(name: string, fn: ReplayHandler) {
  handlers.set(name, fn);
}

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        Promise.resolve(fn(store)).then(
          (result) => {
            if (result && typeof (result as IDBRequest).onsuccess !== "undefined") {
              const req = result as IDBRequest<T>;
              req.onsuccess = () => resolve(req.result);
              req.onerror = () => reject(req.error);
            } else {
              resolve(result as T);
            }
          },
          (err) => reject(err),
        );
        t.onerror = () => reject(t.error);
      }),
  );
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore */
    }
  });
}
export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function enqueue(
  item: Omit<OfflineItem<InsuranceCallbackOfflinePayload>, "id" | "createdAt" | "attempts">,
) {
  if (!isBrowser()) return;
  if (item.kind !== "insurance_callback" || item.handler !== "insurance_callback") {
    throw new Error("This data type cannot be stored offline");
  }
  const record: OfflineItem<InsuranceCallbackOfflinePayload> = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
  };
  await tx("readwrite", (s) => s.put(record));
  notify();
  return record.id;
}

export async function listQueue(): Promise<OfflineItem[]> {
  if (!isBrowser()) return [];
  return tx<OfflineItem[]>("readonly", (s) => s.getAll() as IDBRequest<OfflineItem[]>);
}

export async function removeItem(id: string) {
  if (!isBrowser()) return;
  await tx("readwrite", (s) => s.delete(id));
  notify();
}

export async function clearQueue() {
  if (!isBrowser()) return;
  await tx("readwrite", (s) => s.clear());
  notify();
}

let flushing = false;
export async function flushQueue(): Promise<{ ok: number; failed: number }> {
  if (!isBrowser() || flushing) return { ok: 0, failed: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: 0, failed: 0 };
  flushing = true;
  let ok = 0;
  let failed = 0;
  try {
    const items = await listQueue();
    for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
      const handler = handlers.get(item.handler);
      if (!handler) {
        // No handler registered yet (e.g. before its module loaded). Skip.
        continue;
      }
      try {
        await handler(item.payload);
        await removeItem(item.id);
        ok += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        await tx("readwrite", (s) =>
          s.put({ ...item, attempts: item.attempts + 1, lastError: message }),
        );
      }
    }
  } finally {
    flushing = false;
    notify();
  }
  return { ok, failed };
}

let installed = false;
export function installOfflineQueue() {
  if (!isBrowser() || installed) return;
  installed = true;
  window.addEventListener("online", () => {
    void flushQueue();
  });
  // Opportunistic flush at boot in case the tab was reopened online.
  if (navigator.onLine) {
    setTimeout(() => void flushQueue(), 1500);
  }
}
