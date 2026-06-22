// ══════════════════════ STORAGE LAYER ══════════════════════
// Mode Lokal  → localStorage browser (default, tanpa setup)
// Mode Cloud  → JSONBin.io (semua pengunjung lihat data sama)
//
// Isi VITE_JSONBIN_BIN_ID + VITE_JSONBIN_API_KEY di GitHub Secrets
// untuk mengaktifkan Mode Cloud.
//
// ⚠️ ATURAN PENTING (anti data hilang):
// Saat Mode Cloud AKTIF, loadData() TIDAK BOLEH diam-diam fallback ke
// localStorage kosong kalau fetch ke server gagal — itu bisa membuat
// aplikasi mengira "belum ada data" padahal cuma gagal konek, lalu
// kalau ada save berikutnya, data kosong itu bisa menimpa data asli
// di cloud. Maka loadData() di Mode Cloud akan throw error eksplisit
// kalau gagal fetch, dan kode pemanggil (App.jsx) WAJIB menangani
// error itu dengan menampilkan layar "gagal konek", bukan diam-diam
// menganggap user/tim/data kosong.

const BIN_ID  = import.meta.env.VITE_JSONBIN_BIN_ID  || '';
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY || '';
export const isRemoteEnabled = Boolean(BIN_ID && API_KEY);

const URL_BASE = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
let _cache = null; // hanya dipakai untuk optimasi saveData (read-modify-write)

async function fetchRemote() {
  const r = await fetch(`${URL_BASE}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Fetch remote failed: HTTP ' + r.status);
  const json = await r.json();
  _cache = json.record || {};
  return _cache;
}

async function pushRemote(record) {
  const r = await fetch(URL_BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
    body: JSON.stringify(record),
  });
  if (!r.ok) throw new Error('Push remote failed: HTTP ' + r.status);
  _cache = record;
}

// loadData: di Mode Cloud, KALAU GAGAL FETCH → throw (jangan fallback diam-diam).
// Caller wajib tangkap error ini dan tampilkan UI "gagal konek ke server",
// BUKAN menganggap data kosong/user belum terdaftar.
export async function loadData(key, fallback = null) {
  if (isRemoteEnabled) {
    const rec = await fetchRemote(); // sengaja tidak di-try/catch di sini
    return rec[key] !== undefined ? rec[key] : fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// Versi "aman" untuk auto-refresh/polling: boleh gagal diam-diam
// (karena UI sudah terisi data sebelumnya, polling cuma optional update).
export async function loadDataSafe(key, fallback = null) {
  try {
    return await loadData(key, fallback);
  } catch (e) {
    console.warn('loadDataSafe gagal (akan dicoba lagi nanti):', key, e);
    return undefined; // beda dari null/fallback — penanda "gagal", caller bisa skip update
  }
}

export async function saveData(key, value) {
  // Simpan ke localStorage selalu (sebagai cache/fallback lokal), TAPI
  // di Mode Cloud, sumber kebenaran tetap server — localStorage di sini
  // hanya cadangan kalau-kalau offline.
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}

  if (isRemoteEnabled) {
    // Ambil data TERBARU dari server dulu (bukan cache lama), supaya
    // perubahan dari user lain di key berbeda tidak ketiban/hilang.
    // Kalau fetch ini gagal, JANGAN lanjut push dengan data parsial —
    // throw supaya caller tahu save gagal, daripada diam-diam korup data.
    const rec = await fetchRemote();
    rec[key] = value;
    await pushRemote(rec);
  }
}

// ── MUTATE DATA (atomic-ish read-modify-write) ───────────
// Dipakai untuk operasi seperti "tambah 1 user baru", "approve 1 user",
// "hapus 1 tim" — di mana kita TIDAK mau menimpa pakai snapshot lama dari
// state React (yang mungkin sudah basi beberapa detik), tapi langsung
// fetch versi TERBARU dari server, terapkan perubahan via fungsi, baru push.
//
// Ini bukan transaksi database sungguhan (JSONBin tidak mendukung locking),
// tapi sudah jauh mengurangi kemungkinan "dua orang submit barengan saling
// menimpa" dibanding pola lama (pakai snapshot state React yang sudah basi).
//
// updaterFn menerima object data-saat-ini-di-key-tsb (atau {} kalau belum ada),
// dan harus return object baru.
export async function mutateData(key, updaterFn) {
  if (isRemoteEnabled) {
    const rec = await fetchRemote(); // selalu fresh
    const current = rec[key] || {};
    const updated = updaterFn(current);
    rec[key] = updated;
    await pushRemote(rec);
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
    return updated;
  }
  // Mode lokal: tidak ada concurrent user lain, jadi cukup pola biasa.
  let current = {};
  try {
    const raw = localStorage.getItem(key);
    current = raw !== null ? JSON.parse(raw) : {};
  } catch {}
  const updated = updaterFn(current);
  try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
  return updated;
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

// ── VALIDASI USERNAME ─────────────────────────────────────
// Hanya huruf, angka, underscore, titik, strip. TIDAK BOLEH ada karakter
// '|' karena dipakai sebagai separator key hasil match (groupId|timA|timB),
// dan tidak boleh spasi/simbol aneh lain yang bisa bikin masalah di key JSON.
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,24}$/.test(username);
}

// ── ACTIVITY LOG ───────────────────────────────────────────
// Catatan aktivitas ringan untuk transparansi komunitas: siapa approve
// siapa, siapa tambah/hapus tim, dsb. Disimpan dengan key terpisah supaya
// tidak mengganggu struktur data utama. Dibatasi 200 entri terakhir saja
// (FIFO) supaya ukuran data tidak membengkak terus.
const MAX_LOG_ENTRIES = 200;

export async function logActivity(actorUsername, action, detail = '') {
  try {
    await mutateData('sansan_activity_log', (current) => {
      const list = Array.isArray(current) ? current : [];
      const entry = {
        ts: new Date().toISOString(),
        actor: actorUsername,
        action,
        detail,
      };
      const updated = [entry, ...list].slice(0, MAX_LOG_ENTRIES);
      return updated;
    });
  } catch (e) {
    // Log gagal tersimpan bukan masalah fatal — jangan sampai mengganggu
    // operasi utama (approve/save/dsb) hanya karena log gagal.
    console.warn('Gagal mencatat activity log:', e);
  }
}
