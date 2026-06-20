// ══════════════════════ STORAGE LAYER ══════════════════════
// Mode Lokal  → localStorage browser (default, tanpa setup)
// Mode Cloud  → JSONBin.io (semua pengunjung lihat data sama)
//
// Isi VITE_JSONBIN_BIN_ID + VITE_JSONBIN_API_KEY di GitHub Secrets
// untuk mengaktifkan Mode Cloud.

const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID  || '';
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY || '';
export const isRemoteEnabled = Boolean(BIN_ID && API_KEY);

const URL_BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
let _cache = null; // fallback jika fetch gagal (mis. offline sebentar)

// forceFresh=true → selalu ambil data terbaru dari server (dipakai loadData,
// termasuk saat auto-refresh/polling, supaya perubahan dari user lain kelihatan).
// forceFresh=false → boleh pakai cache (dipakai internal saat saveData,
// supaya tidak perlu fetch 2x untuk operasi read-modify-write yang sama).
async function fetchRemote(forceFresh = true) {
  if (!forceFresh && _cache) return _cache;
  const r = await fetch(`${URL_BASE}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
    cache: 'no-store',
  });
  if (!r.ok) {
    if (_cache) return _cache; // fallback ke cache lama kalau request gagal
    throw new Error('Fetch remote failed: ' + r.status);
  }
  _cache = (await r.json()).record || {};
  return _cache;
}

async function pushRemote(record) {
  _cache = record;
  const r = await fetch(URL_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
    body: JSON.stringify(record),
  });
  if (!r.ok) throw new Error('Push remote failed: ' + r.status);
}

export async function loadData(key, fallback = null) {
  if (isRemoteEnabled) {
    try {
      const rec = await fetchRemote(true); // selalu fresh agar auto-refresh bekerja
      return rec[key] !== undefined ? rec[key] : fallback;
    } catch (e) { console.warn('Remote load failed, fallback to local:', e); }
  }
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export async function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  if (isRemoteEnabled) {
    try {
      // Ambil data terbaru dulu (fresh) sebelum menimpa, supaya perubahan
      // dari user lain di key yang berbeda tidak ketiban/hilang.
      const rec = await fetchRemote(true).catch(() => ({}));
      rec[key] = value;
      await pushRemote(rec);
    } catch (e) { console.warn('Remote save failed:', e); throw e; }
  }
}

// ── EXPORT / IMPORT ──────────────────────────────────────
const ALL_KEYS = ['sansan_teams','sansan_group_results','sansan_users'];

export function exportAllData() {
  const d = {};
  ALL_KEYS.forEach(k => {
    try { const v = localStorage.getItem(k); if (v) d[k] = JSON.parse(v); } catch {}
  });
  return d;
}

export function importAllData(data) {
  Object.entries(data).forEach(([k,v]) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  });
}

// ── AUTH HELPERS (Users disimpan sama seperti data lain) ──
// users = { username: { username, passwordHash, displayName, role:'admin'|'member', status:'pending'|'approved'|'rejected', createdAt } }

// Hash password sederhana (SHA-256 via Web Crypto)
export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Username admin pertama ditentukan lewat env VITE_ADMIN_USERNAME
// default: 'admin' jika tidak diset
export const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
