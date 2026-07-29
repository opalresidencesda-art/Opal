export type QuickAccessIcon = "book" | "file" | "house" | "receipt" | "shield" | "users" | "wallet" | "wrench";

export type QuickAccessCategory = {
  id: "surat" | "panduan" | "data" | "keuangan";
  label: string;
  description: string;
  icon: QuickAccessIcon;
  items: Array<{
    href: string;
    title: string;
    description: string;
    note?: string;
    icon: QuickAccessIcon;
  }>;
};

export const quickAccessCategories: QuickAccessCategory[] = [
  {
    id: "surat",
    label: "Surat",
    description: "Pilih surat yang ingin diajukan. RT akan memeriksa data sebelum dokumen diterbitkan.",
    icon: "file",
    items: [
      {
        href: "/surat/pindah-rumah",
        title: "Surat Keterangan Pindah Rumah",
        description: "Ajukan surat pindah dengan data alamat asal, tujuan, dan anggota keluarga yang ikut.",
        icon: "file",
      },
      {
        href: "/surat/domisili",
        title: "Surat Keterangan Domisili",
        description: "Ajukan keterangan domisili OPAL untuk kebutuhan resmi.",
        icon: "file",
      },
      {
        href: "/surat/belum-menikah",
        title: "Surat Keterangan Belum Menikah",
        description: "Ajukan surat keterangan yang akan diperiksa sebelum diterbitkan RT.",
        icon: "file",
      },
    ],
  },
  {
    id: "panduan",
    label: "Panduan",
    description: "Buka aturan lingkungan, informasi petugas, dan referensi rumah OPAL.",
    icon: "book",
    items: [
      {
        href: "/panduan-harmonis",
        title: "Panduan Harmonis",
        description: "Baca aturan iuran, parkir, stiker kendaraan, renovasi, dan sampah.",
        icon: "book",
      },
      {
        href: "/petugas",
        title: "Petugas Pos & Taman",
        description: "Lihat petugas yang membantu keamanan dan perawatan lingkungan.",
        icon: "shield",
      },
      {
        href: "/spesifikasi-rumah",
        title: "Spesifikasi Cat & Keramik",
        description: "Lihat referensi material rumah asli OPAL untuk perawatan dan renovasi.",
        icon: "wrench",
      },
      {
        href: "/denah",
        title: "Denah OPAL Tipe 6 × 12",
        description: "Buka empat lembar denah rumah dalam galeri yang nyaman dibaca dari ponsel.",
        icon: "house",
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    description: "Perbarui informasi penghuni dan status rumah melalui formulir resmi OPAL.",
    icon: "users",
    items: [
      {
        href: "/pendataan-warga",
        title: "Pendataan warga",
        description: "Isi satu kali untuk satu rumah, termasuk data penghuni, status rumah, KTP, dan KK.",
        note: "KTP dan KK tersimpan privat dan hanya diperiksa pengurus berwenang.",
        icon: "users",
      },
    ],
  },
  {
    id: "keuangan",
    label: "Keuangan",
    description: "Periksa iuran yang berlaku dan pembukuan publik OPAL.",
    icon: "wallet",
    items: [
      {
        href: "/kas",
        title: "Kas OPAL",
        description: "Lihat ringkasan pemasukan, pengeluaran, dan pembukuan publik.",
        icon: "wallet",
      },
      {
        href: "#iuran",
        title: "Iuran aktif",
        description: "Lihat nominal iuran per rumah yang sedang berlaku.",
        icon: "receipt",
      },
    ],
  },
];
