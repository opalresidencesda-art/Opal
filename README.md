# Portal Warga OPAL

Portal operasional OPAL Residence: panduan native, pendataan warga dengan bukti privat, Kas terstruktur, tiga layanan surat siap-cetak, serta panel RT. Linktree dapat tetap hidup selama masa transisi, tetapi tidak lagi menjadi sumber utama layanan.

## Yang sudah native

- `/panduan-harmonis`: panduan PDF dipindahkan menjadi halaman yang dapat ditautkan per bagian; nominal Pondok Tjandra aktif adalah Rp245.000 dan Kas OPAL Rp25.000.
- `/pendataan-warga`: satu rumah per pengisian, dengan KTP/KK maksimum 10 MB per gambar ke Storage privat dan tanda-terima email tanpa data sensitif.
- `/surat/pindah-rumah`, `/surat/domisili`, `/surat/belum-menikah`: alur ajukan, review, revisi/tolak, lalu PDF A4 bernomor. Tanda tangan dan stempel RT tetap manual setelah cetak.
- `/kas`: ringkasan publik dan informasi rekening BCA Kas OPAL; riwayat per rumah hanya melalui `/rumah/[token]` yang dibuat RT.
- `/petugas`, `/spesifikasi-rumah`, `/denah`: direktori kerja, spesifikasi, dan empat lembar denah asli yang sudah dipindahkan sebagai aset lokal.
- `/admin`: antrean pendataan/surat, penerbitan, pengaturan nomor surat, Kas, token rumah, petugas, spesifikasi, denah, panduan, dan pengumuman.

## Menjalankan lokal

Di Windows PowerShell, gunakan `cmd /c` bila eksekusi `npm.ps1` diblokir:

```powershell
cmd /c npm install
cmd /c npm run dev
```

Buka `http://localhost:3000`. Tanpa konfigurasi Supabase, halaman publik tetap dapat ditinjau, sedangkan mutasi data serta Admin akan terkunci.

## Menyiapkan Supabase dan Admin

1. Salin `.env.example` ke `.env.local`, lalu isi URL, publishable key, dan service-role key.
2. Di Supabase SQL Editor, jalankan [schema.sql](supabase/schema.sql), kemudian [seed.sql](supabase/seed.sql).
3. Buat akun RT di **Supabase Dashboard → Authentication → Users → Add user**, dengan email dan kata sandi yang akan dipakai masuk. Lalu masukkan email yang sama pada tabel admin:

   ```sql
   insert into public.admin_users (email) values ('email-rt-anda@example.com');
   ```

4. Buka `/admin`, masuk memakai email dan kata sandi tersebut, lalu isi Pengaturan Penerbitan Surat. Penerbitan tetap terkunci sampai semua identitas RT dan format nomor resmi disimpan.

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server dan skrip impor. Jangan pernah memasukkannya ke variabel `NEXT_PUBLIC_*`, browser, atau Git.

## Migrasi data lama

Jalankan selalu ke proyek staging lebih dulu. Skrip tidak langsung mempublikasikan transaksi Kas; RT perlu merekonsiliasi jumlah baris dan total rupiah sebelum menandai ringkasan sebagai publik.

```powershell
# Periksa hasil normalisasi workbook tanpa menulis data.
$env:OPAL_KAS_XLSX = 'C:\aman\Kas OPAL.xlsx'
cmd /c npm run import:kas -- --dry-run

# Jalankan impor idempoten setelah konfigurasi env lengkap.
cmd /c npm run import:kas

# Data Google Form + berkas identitas memakai manifest privat JSON, bukan Git.
$env:OPAL_RESIDENT_MANIFEST = 'C:\aman\resident-manifest.json'
cmd /c npm run import:residents
```

`scripts/import-resident-manifest.mjs` menerima JSON array berisi data rumah dan daftar path bukti lokal. File mentah Google Form/Drive tidak disimpan di repository. Sumber Google lama dipertahankan sampai RT menyetujui pemeriksaan parity.

## Pemeriksaan

```powershell
cmd /c npm run test
cmd /c npm run lint
cmd /c npm run build
```

Sebelum rilis: uji pengiriman pendataan dengan data sintetis, akses token rumah, review dan penerbitan surat, unduh PDF, pembatasan akun non-admin, serta halaman mobile. Setelah itu arahkan masing-masing tombol Linktree ke halaman native yang setara.
