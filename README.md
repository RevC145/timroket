# 🃏 SANSAN TCG Dashboard

Dashboard komunitas Pokemon TCG Indonesia dengan sistem login, approval admin,
standings divisi, deck builder, dan statistik lengkap.

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🔐 **Login & Signup** | User daftar → menunggu approval admin → bisa login |
| 👑 **Panel Admin** | Approve/tolak user, kelola semua data, backup |
| 🏠 **Overview** | Klasemen gabungan semua divisi |
| 🛡️ **Divisi** | Standings per divisi + input hasil match |
| 🃏 **Tim & Deck** | Kelola tim, pemain, deck list dari 200+ kartu |
| 📊 **Stats** | Win rate, prize cards, kartu populer, riwayat match |
| 💾 **Backup** | Export/import data JSON kapan saja |
| 📱 **Mobile** | Responsive untuk HP dan desktop |
| ☁️ **Mode Cloud** | Opsional — data tersinkron via JSONBin.io |

## 📁 Struktur File

```
sansantcgdashboard/
├── .github/workflows/deploy.yml   ← auto deploy ke GitHub Pages
├── public/
│   ├── favicon.png                ← ikon tab browser
│   ├── apple-touch-icon.png       ← ikon iOS
│   └── logo-full.png
├── src/
│   ├── assets/logoData.js         ← logo base64
│   ├── App.jsx                    ← komponen utama
│   ├── cardDatabase.js            ← 200+ kartu Pokemon TCG
│   ├── index.css
│   ├── main.jsx
│   ├── standings.js               ← logic klasemen & stats
│   └── storage.js                 ← layer penyimpanan
├── index.html
├── package.json
├── vite.config.js                 ← PENTING: sesuaikan 'base'
└── .env.example
```

---

## 🚀 Langkah Deploy ke GitHub Pages

### LANGKAH 1 — Buat Repository GitHub

1. Buka **github.com/new**
2. Nama repo: **`sansantcgdashboard`** (harus sama persis)
3. Pilih **Public**, klik **Create repository**

### LANGKAH 2 — Pastikan `vite.config.js` sudah benar

```js
base: '/sansantcgdashboard/',
```

### LANGKAH 3 — Upload via Terminal

```bash
cd sansantcgdashboard

git init
git add .
git commit -m "Initial commit: SANSAN TCG Dashboard"
git branch -M main
git remote add origin https://github.com/USERNAME/sansantcgdashboard.git
git push -u origin main
```

> Ganti USERNAME dengan username GitHub kamu.

### LANGKAH 4 — Aktifkan GitHub Pages

1. Repo GitHub → **Settings → Pages**
2. **Source** → pilih **GitHub Actions**
3. Selesai!

### LANGKAH 5 — Cek Deploy

- Buka tab **Actions** → tunggu workflow ✅ hijau
- Situs live di: **`https://USERNAME.github.io/sansantcgdashboard/`**

---

## 👑 Setup Admin Pertama

1. Buka situs → klik **"Daftar di sini"**
2. Isi username **persis** sama dengan `VITE_ADMIN_USERNAME` (default: `admin`)
3. Admin langsung login tanpa approval
4. User lain yang signup muncul di **tab Admin → Menunggu Approval**

### Ubah username admin (via GitHub Secrets):

1. Repo → **Settings → Secrets and variables → Actions**
2. **New secret**: Name: `VITE_ADMIN_USERNAME`, Value: username pilihanmu
3. Re-run workflow

---

## ☁️ Mode Cloud (Opsional — Data Komunal)

Agar semua pengunjung melihat data yang sama:

1. Daftar gratis di **[jsonbin.io](https://jsonbin.io)**
2. Buat Bin baru dengan isi `{}`, salin Bin ID dan X-Master-Key
3. Repo GitHub → **Settings → Secrets → Actions**, tambahkan:
   - `VITE_JSONBIN_BIN_ID` → Bin ID
   - `VITE_JSONBIN_API_KEY` → X-Master-Key
4. Re-run workflow → badge "Mode Cloud" muncul di header

---

## 💻 Development Lokal

```bash
npm install
npm run dev
# buka http://localhost:5173/sansantcgdashboard/
```

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---|---|
| Situs 404 | Pastikan Source di Pages sudah "GitHub Actions" |
| Situs tampil kode mentah | Cek `base` di `vite.config.js` sudah sesuai nama repo |
| Workflow error "lock file" | Pastikan deploy.yml pakai `npm install` bukan `npm ci` |
| Workflow "exit code 1" | Klik job build di Actions → expand step Build → cek error |
