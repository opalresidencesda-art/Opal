import { DocumentRequestForm } from "@/components/document-request-form";

export const metadata = { title: "Surat Keterangan Belum Menikah" };

export default function BelumMenikahPage() {
  return <main className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><p className="text-sm font-semibold text-brand">Layanan surat</p><h1 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl">Keterangan belum menikah, siap diperiksa RT.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Setelah disetujui RT, nomor surat dibuat otomatis dan PDF diarsipkan privat sampai dicetak serta ditandatangani manual.</p><DocumentRequestForm type="single" /></main>;
}
