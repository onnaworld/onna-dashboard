// ─── Offline Sync Queue ──────────────────────────────────────────────────────
// Queues failed API writes in IndexedDB and flushes when connectivity returns.

const DB_NAME = 'onna_sync_queue';
const STORE = 'pending_writes';
const DB_VERSION = 1;

let _db = null;
let _flushing = false;
let _onStatusChange = null;

export const setSyncStatusCallback = (cb) => { _onStatusChange = cb; };

function _openDb() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(url, options) {
  try {
    const db = await _openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      url,
      method: options.method || 'GET',
      headers: Object.fromEntries(Object.entries(options.headers || {})),
      body: options.body || null,
      timestamp: Date.now(),
    });
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    if (_onStatusChange) _onStatusChange(await pendingCount());
  } catch (e) {
    console.warn('[SyncQueue] enqueue failed:', e);
  }
}

export async function pendingCount() {
  try {
    const db = await _openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch { return 0; }
}

export async function flush() {
  if (_flushing || !navigator.onLine) return;
  _flushing = true;
  try {
    const db = await _openDb();
    const items = await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    for (const item of items) {
      try {
        const resp = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });
        if (resp.ok || resp.status === 401) {
          // Success or auth expired — either way, remove from queue
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).delete(item.id);
          await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
        } else {
          // Server error — stop flushing, retry later
          break;
        }
      } catch {
        // Network still down — stop
        break;
      }
    }
    if (_onStatusChange) _onStatusChange(await pendingCount());
  } finally {
    _flushing = false;
  }
}

// Auto-flush on reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
}
