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

async function _deleteAllForUrl(store, url) {
  const existing = await new Promise(resolve => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
  existing.filter(i => i.url === url).forEach(i => store.delete(i.id));
}

export async function enqueue(url, options) {
  try {
    const db = await _openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    // A save is always the full current document, not a diff — so if a
    // newer attempt for this same resource fails too, only the latest one
    // is worth replaying. Keeping older queued attempts around risks one
    // of them later succeeding and overwriting data that's already been
    // superseded, which is exactly how an edit can silently "vanish."
    await _deleteAllForUrl(store, url);
    store.add({
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

// Call after a normal (non-queued) write for this URL succeeds, so a stale
// queued retry for the same resource — from an earlier failed attempt —
// can never later replay and clobber the newer data that already saved.
export async function purgeUrl(url) {
  try {
    const db = await _openDb();
    const tx = db.transaction(STORE, 'readwrite');
    await _deleteAllForUrl(tx.objectStore(STORE), url);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    if (_onStatusChange) _onStatusChange(await pendingCount());
  } catch {}
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
  // Deliberately does not gate on navigator.onLine — it's an unreliable
  // signal (can report "online" while a specific request still can't
  // succeed, e.g. server error, rate limit, DNS hiccup for one host). Just
  // attempt delivery and let a failed fetch decide, so periodic polling
  // below is the actual retry mechanism rather than a browser flag.
  if (_flushing) return;
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

// Auto-flush on reconnect, on startup (picks up anything still queued from
// a previous session/tab), and periodically — the periodic poll is the
// real safety net, since 'online'/'offline' events don't fire for the
// failure modes that actually land writes in this queue.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flush());
  flush();
  setInterval(() => flush(), 15 * 1000);
}
