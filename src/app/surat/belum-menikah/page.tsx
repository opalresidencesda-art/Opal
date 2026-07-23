import { DocumentRequestForm } from "@/components/document-request-form";

export const metadata = { title: "Surat Keterangan Belum Menikah" };

export default function BelumMenikahPage() {
  return <div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><section className="border-b border-line pb-9"><p className="text-[0.72rem] font-bold tracking-[0.14em] text-brand">LAYANAN SURAT</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.065em] text-ink sm:text-5xl">Keterangan belum menikah, siap diperiksa RT.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Setelah disetujui RT, nomor surat dibuat otomatis dan PDF diarsipkan privat sampai dicetak serta ditandatangani manual.</p></section><div className="py-10 sm:py-12"><DocumentRequestForm type="single" /></div></div>;
}
