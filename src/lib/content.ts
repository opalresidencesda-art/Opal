export type FeeSchedule = {
  id?: string;
  label: string;
  amountRupiah: number;
  paymentMethod: string;
  destination: string;
  description: string;
  effectiveFrom: string;
  active: boolean;
};

export type Announcement = {
  id?: string;
  title: string;
  body: string;
  publishedAt: string;
  pinned: boolean;
  imagePath?: string | null;
  imageAlt?: string | null;
  imageUrl?: string | null;
};

export function announcementImageUrl(announcement: Pick<Announcement, "id" | "imagePath" | "imageUrl">) {
  if (announcement.imageUrl) return announcement.imageUrl;
  return announcement.id && announcement.imagePath ? `/api/announcement-image/${announcement.id}` : null;
}

export type Resource = {
  id?: string;
  title: string;
  description: string;
  href: string;
  category: "Keuangan" | "Surat" | "Data warga" | "Fasilitas" | "Rumah";
  requiresGoogleLogin?: boolean;
};

export type GuideSection = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  sortOrder: number;
};

export type PortalData = {
  fees: FeeSchedule[];
  announcements: Announcement[];
  resources: Resource[];
  guideSections: GuideSection[];
};

export function getNextAnnouncementIndex(index: number, count: number, step = 1) {
  if (count < 1) return 0;
  return (index + step + count) % count;
}

export function sortGuideSections(sections: GuideSection[]) {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export const defaultFees: FeeSchedule[] = [
  {
    label: "Iuran Pondok Tjandra",
    amountRupiah: 245000,
    paymentMethod: "Tunai melalui Pos Satpam OPAL",
    destination: "Pondok Tjandra Indah",
    description: "Per bulan per rumah, bukan per KK. Digunakan untuk kebersihan, keamanan, dan taman.",
    effectiveFrom: "2026-07-01",
    active: true,
  },
  {
    label: "Iuran Kas OPAL",
    amountRupiah: 25000,
    paymentMethod: "Transfer rekening Kas OPAL",
    destination: "BCA 1011815125 a.n. Neria Kezia Jayanti",
    description: "Per bulan per rumah, bukan per KK. Digunakan untuk CCTV, fogging, pembersihan selokan, dan fasilitas bersama.",
    effectiveFrom: "2023-07-01",
    active: true,
  },
];

export const defaultAnnouncements: Announcement[] = [
  {
    title: "81 TAHUN KEMERDEKAAN RI",
    body: `🇲🇨🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩

GAME 17AN
🗓️ Sabtu, 8 Agustus 2026
🕒 15.00 WIB
🛝 Taman Bermain Delima
👕 Dresscode Merah Putih 🇲🇨

3K JALAN SEHAT & SENAM
🗓️ Minggu, 9 Agustus 2026
🕒 05.30 WIB
🏁 Taman Bermain Delima
👕 Dresscode Merah Putih 🇲🇨

MALAM SYUKURAN 17 AGUSTUS
🗓️ Minggu, 16 Agustus 2026
🕒 17.30 WIB
📍 Taman Bermain Delima
👕 Dresscode Merah Putih 🇲🇨

✅ Permainan untuk anak dan dewasa berhadiah
✅ Seru-seruan 3K Jalan Sehat & Senam bareng
✅ Tiap KK mendapat 1 kupon undian Jalan Sehat dan 1 kupon undian Malam Syukuran
✅ Hadiah untuk kostum terheboh Jalan Sehat
✅ Kupon Makanan Bergizi Gratis di Malam Syukuran
✅ Bazar makanan & minuman enak
✅ Doorprize puluhan juta rupiah

MERDEKA BERSATU GEMILANG
🇲🇨🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩🇮🇩`,
    publishedAt: "2026-08-08",
    pinned: true,
    imageUrl: "/images/announcements/17-agustus-2026.webp",
    imageAlt: "Poster acara Merdeka Bersatu Gemilang di Delima, Agustus 2026",
  },
  {
    title: "Ikuti Instagram Delima Residence",
    body: `Delima Residence punya Instagram resmi.

Ikuti @delimaresidencesda untuk melihat kabar kegiatan, informasi lingkungan, dan momen warga OPAL.

https://www.instagram.com/delimaresidencesda/`,
    publishedAt: "2026-08-14",
    pinned: false,
    imageUrl: "/images/announcements/delima-instagram-profile.png",
    imageAlt: "Profil Instagram resmi Delima Residence dengan unggahan kegiatan warga.",
  },
];

export const defaultResources: Resource[] = [
  {
    title: "Kas OPAL",
    description: "Pembukuan dan informasi iuran warga.",
    href: "https://docs.google.com/spreadsheets/d/1GoA56flzgY-qJhXx4beZ5yvGSv3bLYIdYi8lhQvm0IA/edit?usp=sharing",
    category: "Keuangan",
  },
  {
    title: "Surat Keterangan Pindah Rumah",
    description: "Unduh format surat keterangan pindah rumah.",
    href: "https://drive.google.com/uc?export=download&id=1RtAtt2Zfa0rR0ffndJnkgWQz18qN82gG",
    category: "Surat",
  },
  {
    title: "Surat Keterangan Domisili",
    description: "Unduh format surat keterangan domisili.",
    href: "https://drive.google.com/uc?export=download&id=1t3YkIO9l_hUncoGyww7ixlEIDl1-AgMB",
    category: "Surat",
  },
  {
    title: "Formulir Warga",
    description: "Pengisian data warga OPAL.",
    href: "https://forms.gle/jTQez4HBLuQQQGYKA",
    category: "Data warga",
    requiresGoogleLogin: true,
  },
  {
    title: "Spesifikasi Cat dan Keramik",
    description: "Acuan warna cat serta spesifikasi keramik rumah.",
    href: "https://docs.google.com/document/d/1EFFWZlKYz0-bq32JyLDAfPPHsdPNlKUeUw6Td3pc8xE/edit?usp=sharing",
    category: "Rumah",
  },
  {
    title: "Denah OPAL Type 6 x 12",
    description: "Folder denah rumah OPAL Type 6 x 12.",
    href: "https://drive.google.com/drive/folders/1Y5SDYOyxJFcMTAuBQgndaPFgAoxsiTij?usp=sharing",
    category: "Rumah",
  },
  {
    title: "Surat Keterangan Belum Menikah",
    description: "Format surat keterangan belum menikah.",
    href: "https://docs.google.com/document/d/1Sj_NuC6lVcJzq1JlFeeBcUeKW7ZDe2Cq/edit?usp=drive_link&ouid=105034026230313585332&rtpof=true&sd=true",
    category: "Surat",
  },
];

export const defaultGuideSections: GuideSection[] = [
  {
    slug: "iuran",
    title: "Iuran warga",
    summary: "Dua iuran rutin untuk operasional dan fasilitas bersama OPAL.",
    sortOrder: 1,
    bodyMarkdown: `## Iuran rutin per rumah

Setiap rumah warga OPAL memiliki dua iuran bulanan. Pembayaran dihitung **per rumah**, bukan per KK.

### Iuran Pondok Tjandra

- Dibayarkan tunai melalui Pos Satpam OPAL.
- Digunakan untuk kebersihan, keamanan, dan taman.

### Iuran Kas OPAL

- Dibayarkan melalui transfer ke rekening Kas OPAL.
- Digunakan untuk CCTV, fogging, pembersihan selokan, dan fasilitas atau kepentingan bersama lainnya.`,
  },
  {
    slug: "parkir",
    title: "Parkir mobil",
    summary: "Jalan lingkungan adalah fasilitas bersama. Parkir perlu menjaga akses semua warga.",
    sortOrder: 2,
    bodyMarkdown: `## Mobil pertama

Setiap warga wajib memasukkan mobil pertama ke dalam carport rumah agar lalu lintas jalan tetap lega.

## Mobil kedua

- Mobil kedua diparkir di depan rumah sendiri.
- Posisikan mobil mepet pembatas tepi jalan agar tidak mengambil hak warga lain.
- Jalan di depan rumah tetap merupakan fasilitas bersama.

## Mobil ketiga dan tamu

- Mobil ketiga diparkir di rumah kosong atau area pojok gang yang tidak mengganggu keluar masuk mobil tetangga.
- Mobil tamu dapat menggunakan rumah kosong atau pojok gang dengan prinsip yang sama.

## Prinsip utama

Setiap kendaraan yang diparkir di jalan kompleks tidak boleh mengganggu aktivitas warga umum. Bila dua rumah memiliki mobil pada waktu yang sama, warga diharapkan saling berkomunikasi agar tetap rukun.`,
  },
  {
    slug: "stiker-kendaraan",
    title: "Stiker kendaraan",
    summary: "Identifikasi kendaraan warga untuk membantu petugas menjaga keamanan lingkungan.",
    sortOrder: 3,
    bodyMarkdown: `## Tujuan

Stiker membantu satpam mengenali kendaraan warga dan memeriksa kendaraan yang belum dikenal. Petugas OPAL dan pedagang keliling yang rutin melintas juga menggunakan stiker pengenal.

## Bentuk stiker

- **Mobil:** stiker statis tanpa lem, ukuran kotak 7 cm x 4 cm.
- **Motor:** cutting sticker dengan lem, ukuran bulat 7,5 cm x 7,5 cm.

## Pemasangan

- Stiker mobil dipasang di kaca depan dari bagian dalam, di sisi kiri bila dilihat dari posisi pengemudi.
- Stiker motor dipasang di bagian depan dan tidak menghalangi pelat nomor.

## Mendapatkan stiker

Stiker dapat diambil di Pos Satpam OPAL dengan mengisi merek, tipe, dan pelat nomor kendaraan.`,
  },
  {
    slug: "renovasi",
    title: "Panduan renovasi",
    summary: "Renovasi tetap dapat berjalan tanpa mengganggu keamanan, kebersihan, dan tetangga.",
    sortOrder: 4,
    bodyMarkdown: `## Sebelum renovasi

1. Berpamitan dan meminta izin kepada tetangga kanan, kiri, serta belakang rumah, khususnya bila pekerjaan menimbulkan debu atau suara keras.
2. Renovasi skala besar perlu meminta izin kepada PT Pondok Tjandra. Skala besar mencakup pekerjaan lebih dari tiga hari, perubahan struktur bangunan, dan pekerjaan lantai berat.
3. Laporkan kepada satpam bila ada truk pikap masuk untuk membawa material.

## Saat pekerjaan berlangsung

4. Semua material renovasi dan sampahnya disimpan di dalam area rumah.
5. Jam kerja tukang adalah pukul 07.00 hingga 17.00 WIB, kecuali pekerjaan tanpa suara bising seperti pengecatan.
6. Jangan membuang gragal atau sampah bangunan di area OPAL maupun tempat sampah rumah tangga.

## Kepatuhan dan keamanan

7. Hormati peraturan developer PT Pondok Tjandra Indah dan kepengurusan RT OPAL.
8. Bila tukang menginap, serahkan KTP kepada satpam dan beri tahu RT. Tukang tidak diperkenankan berkeliling setelah selesai bekerja, terutama pada malam hari.`,
  },
  {
    slug: "sampah-rumah-tangga",
    title: "Sampah rumah tangga",
    summary: "Tempat sampah tertutup membantu lingkungan tetap bersih, sehat, dan nyaman.",
    sortOrder: 5,
    bodyMarkdown: `## Tempat sampah rumah

1. Setiap rumah wajib memiliki tempat sampah yang memadai dan tertutup rapat.
2. Gunakan tempat sampah dari developer selama masih layak pakai.
3. Bila tempat sampah lama hilang atau tidak dapat digunakan, sediakan pengganti yang berfungsi baik. Acuan kapasitas yang digunakan adalah **240 liter**.

## Alasan aturan ini

- Mencegah sampah menjadi sarang tikus dan kucing karena sisa makanan terbuka.
- Menghindari bau sampah basah dan air kotor yang mengalir ke jalan atau rumah tetangga.
- Mencegah sampah masuk ke jalur got dan menyumbat saluran air OPAL.

## Konsekuensi

Bila ditemukan sampah yang tidak mematuhi aturan, petugas berhak untuk tidak mengambil sampah dari rumah yang melanggar.`,
  },
];

export const defaultPortalData: PortalData = {
  fees: defaultFees,
  announcements: defaultAnnouncements,
  resources: defaultResources,
  guideSections: defaultGuideSections,
};
