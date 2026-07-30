-- Portal Warga OPAL: jalankan setelah schema.sql.
-- Ganti email ini dengan email pengurus, lalu hapus baris komentar di bawah.
-- insert into public.admin_users (email) values ('nama@email.com');

insert into public.fee_schedules (label, amount_rupiah, payment_method, destination, description, effective_from, is_active)
values
  ('Iuran Pondok Tjandra', 245000, 'Tunai melalui Pos Satpam OPAL', 'Pondok Tjandra Indah', 'Per bulan per rumah, bukan per KK. Digunakan untuk kebersihan, keamanan, dan taman.', '2026-07-01', true),
  ('Iuran Kas OPAL', 25000, 'Transfer rekening Kas OPAL', 'BCA 1011815125 a.n. Neria Kezia Jayanti', 'Per bulan per rumah, bukan per KK. Digunakan untuk CCTV, fogging, pembersihan selokan, dan fasilitas bersama.', '2023-07-01', true)
on conflict (label, effective_from) do update set amount_rupiah = excluded.amount_rupiah, payment_method = excluded.payment_method, destination = excluded.destination, description = excluded.description, is_active = excluded.is_active;

insert into public.guide_sections (slug, title, summary, body_markdown, sort_order, published)
values
('iuran', 'Iuran warga', 'Dua iuran rutin untuk operasional dan fasilitas bersama OPAL.', $$## Iuran rutin per rumah

Setiap rumah warga OPAL memiliki dua iuran bulanan. Pembayaran dihitung **per rumah**, bukan per KK.

### Iuran Pondok Tjandra

- Dibayarkan tunai melalui Pos Satpam OPAL.
- Digunakan untuk kebersihan, keamanan, dan taman.

### Iuran Kas OPAL

- Dibayarkan melalui transfer ke rekening Kas OPAL.
- Digunakan untuk CCTV, fogging, pembersihan selokan, dan fasilitas atau kepentingan bersama lainnya.$$ , 1, true),
('parkir', 'Parkir mobil', 'Jalan lingkungan adalah fasilitas bersama. Parkir perlu menjaga akses semua warga.', $$## Mobil pertama

Setiap warga wajib memasukkan mobil pertama ke dalam carport rumah agar lalu lintas jalan tetap lega.

## Mobil kedua

- Mobil kedua diparkir di depan rumah sendiri.
- Posisikan mobil mepet pembatas tepi jalan agar tidak mengambil hak warga lain.
- Jalan di depan rumah tetap merupakan fasilitas bersama.

## Mobil ketiga dan tamu

- Mobil ketiga diparkir di rumah kosong atau area pojok gang yang tidak mengganggu keluar masuk mobil tetangga.
- Mobil tamu dapat menggunakan rumah kosong atau pojok gang dengan prinsip yang sama.

## Prinsip utama

Setiap kendaraan yang diparkir di jalan kompleks tidak boleh mengganggu aktivitas warga umum. Bila dua rumah memiliki mobil pada waktu yang sama, warga diharapkan saling berkomunikasi agar tetap rukun.$$ , 2, true),
('stiker-kendaraan', 'Stiker kendaraan', 'Identifikasi kendaraan warga untuk membantu petugas menjaga keamanan lingkungan.', $$## Tujuan

Stiker membantu satpam mengenali kendaraan warga dan memeriksa kendaraan yang belum dikenal. Petugas OPAL dan pedagang keliling yang rutin melintas juga menggunakan stiker pengenal.

## Bentuk stiker

- **Mobil:** stiker statis tanpa lem, ukuran kotak 7 cm x 4 cm.
- **Motor:** cutting sticker dengan lem, ukuran bulat 7,5 cm x 7,5 cm.

## Pemasangan

- Stiker mobil dipasang di kaca depan dari bagian dalam, di sisi kiri bila dilihat dari posisi pengemudi.
- Stiker motor dipasang di bagian depan dan tidak menghalangi pelat nomor.

## Mendapatkan stiker

Stiker dapat diambil di Pos Satpam OPAL dengan mengisi merek, tipe, dan pelat nomor kendaraan.$$ , 3, true),
('renovasi', 'Panduan renovasi', 'Renovasi tetap dapat berjalan tanpa mengganggu keamanan, kebersihan, dan tetangga.', $$## Sebelum renovasi

1. Berpamitan dan meminta izin kepada tetangga kanan, kiri, serta belakang rumah, khususnya bila pekerjaan menimbulkan debu atau suara keras.
2. Renovasi skala besar perlu meminta izin kepada PT Pondok Tjandra. Skala besar mencakup pekerjaan lebih dari tiga hari, perubahan struktur bangunan, dan pekerjaan lantai berat.
3. Laporkan kepada satpam bila ada truk pikap masuk untuk membawa material.

## Saat pekerjaan berlangsung

4. Semua material renovasi dan sampahnya disimpan di dalam area rumah.
5. Jam kerja tukang adalah pukul 07.00 hingga 17.00 WIB, kecuali pekerjaan tanpa suara bising seperti pengecatan.
6. Jangan membuang gragal atau sampah bangunan di area OPAL maupun tempat sampah rumah tangga.

## Kepatuhan dan keamanan

7. Hormati peraturan developer PT Pondok Tjandra Indah dan kepengurusan RT OPAL.
8. Bila tukang menginap, serahkan KTP kepada satpam dan beri tahu RT. Tukang tidak diperkenankan berkeliling setelah selesai bekerja, terutama pada malam hari.$$ , 4, true),
('sampah-rumah-tangga', 'Sampah rumah tangga', 'Tempat sampah tertutup membantu lingkungan tetap bersih, sehat, dan nyaman.', $$## Tempat sampah rumah

1. Setiap rumah wajib memiliki tempat sampah yang memadai dan tertutup rapat.
2. Gunakan tempat sampah dari developer selama masih layak pakai.
3. Bila tempat sampah lama hilang atau tidak dapat digunakan, sediakan pengganti yang berfungsi baik. Acuan kapasitas yang digunakan adalah **240 liter**.

## Alasan aturan ini

- Mencegah sampah menjadi sarang tikus dan kucing karena sisa makanan terbuka.
- Menghindari bau sampah basah dan air kotor yang mengalir ke jalan atau rumah tetangga.
- Mencegah sampah masuk ke jalur got dan menyumbat saluran air OPAL.

## Konsekuensi

Bila ditemukan sampah yang tidak mematuhi aturan, petugas berhak untuk tidak mengambil sampah dari rumah yang melanggar.$$ , 5, true)
on conflict (slug) do update set title = excluded.title, summary = excluded.summary, body_markdown = excluded.body_markdown, sort_order = excluded.sort_order, published = excluded.published;

insert into public.announcements (title, body, published_at, pinned, published)
select 'Panduan warga kini tersedia dalam format website', 'Aturan parkir, renovasi, stiker kendaraan, dan sampah dapat dibaca lebih nyaman dari ponsel.', '2026-07-18', true, true
where not exists (select 1 from public.announcements where title = 'Panduan warga kini tersedia dalam format website');

delete from public.resources
where title = 'Petugas Pos dan Taman'
  and href = 'https://docs.google.com/document/d/1wmdqSlR7bnE3eKftS89f7sxj6yCgZEvZhZORbBemUAA/edit?usp=sharing';

insert into public.resources (title, description, href, category, requires_google_login, sort_order, published)
values
('Kas OPAL', 'Pembukuan dan informasi iuran warga.', 'https://docs.google.com/spreadsheets/d/1GoA56flzgY-qJhXx4beZ5yvGSv3bLYIdYi8lhQvm0IA/edit?usp=sharing', 'Keuangan', false, 1, true),
('Surat Keterangan Pindah Rumah', 'Unduh format surat keterangan pindah rumah.', 'https://drive.google.com/uc?export=download&id=1RtAtt2Zfa0rR0ffndJnkgWQz18qN82gG', 'Surat', false, 2, true),
('Surat Keterangan Domisili', 'Unduh format surat keterangan domisili.', 'https://drive.google.com/uc?export=download&id=1t3YkIO9l_hUncoGyww7ixlEIDl1-AgMB', 'Surat', false, 3, true),
('Formulir Warga', 'Pengisian data warga OPAL.', 'https://forms.gle/jTQez4HBLuQQQGYKA', 'Data warga', true, 4, true),
('Spesifikasi Cat dan Keramik', 'Acuan warna cat serta spesifikasi keramik rumah.', 'https://docs.google.com/document/d/1EFFWZlKYz0-bq32JyLDAfPPHsdPNlKUeUw6Td3pc8xE/edit?usp=sharing', 'Rumah', false, 6, true),
('Denah OPAL Type 6 x 12', 'Folder denah rumah OPAL Type 6 x 12.', 'https://drive.google.com/drive/folders/1Y5SDYOyxJFcMTAuBQgndaPFgAoxsiTij?usp=sharing', 'Rumah', false, 7, true),
('Surat Keterangan Belum Menikah', 'Format surat keterangan belum menikah.', 'https://docs.google.com/document/d/1Sj_NuC6lVcJzq1JlFeeBcUeKW7ZDe2Cq/edit?usp=drive_link&ouid=105034026230313585332&rtpof=true&sd=true', 'Surat', false, 8, true)
on conflict (title) do update set description = excluded.description, href = excluded.href, category = excluded.category, requires_google_login = excluded.requires_google_login, sort_order = excluded.sort_order, published = excluded.published;

insert into public.staff_profiles (name, role, whatsapp, published, sort_order)
values
('Adi', 'Petugas Pos & Taman', '6281335703203', true, 1),
('Bagus', 'Petugas Pos & Taman', '6281335703203', true, 2),
('Sholeh', 'Petugas Pos & Taman', '6281259804740', true, 3),
('Imam', 'Petugas Pos & Taman', null, true, 4),
('Syaiful', 'Petugas Pos & Taman', null, true, 5)
on conflict (name, role) do update set whatsapp = excluded.whatsapp, published = excluded.published, sort_order = excluded.sort_order;

insert into public.home_specs (category, label, value, published, sort_order)
values
('Keramik', 'Lantai induk', 'Granite Tile Niro GEDOO 60 x 60 PN', true, 1),
('Keramik', 'Teras depan', 'Granite Tile Niro PI 504 60 x 60 MP', true, 2),
('Keramik', 'Teras belakang', 'Granite Tile Niro PB 502 60 x 60 MP', true, 3),
('Keramik', 'Balkon', 'Granite Tile Niro PI 502 60 x 60 MP', true, 4),
('Keramik', 'Dinding dapur', 'Roman Adelaide Bone 33.3 x 33.3', true, 5),
('Keramik', 'Kamar mandi induk', 'Roman Crhysant Bone G 447311 40 x 40', true, 6),
('Cat', 'Interior', 'Dulux A700 Matt Ghost Grey 17GY68/005', true, 10),
('Cat', 'Eksterior', 'Dulux Weathershield E1000 Galant Grey 40545', true, 11),
('Cat', 'Plafon', 'Dulux Diamond Ceiling White Supermatt', true, 12),
('Cat', 'Listplank', 'E1000 Brilliant White 2290', true, 13),
('Kontak', 'Keramik', 'UD Cendrawasih / Suzana, 082139219000', true, 20)
on conflict (category, label) do update set value = excluded.value, published = excluded.published, sort_order = excluded.sort_order;
