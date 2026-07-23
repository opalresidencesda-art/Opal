import { DocumentRequestForm } from "@/components/document-request-form";

export const metadata = { title: "Surat Keterangan Pindah Rumah" };

export default function PindahRumahPage() {
  return <div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><section className="border-b border-line pb-9"><p className="text-[0.72rem] font-bold tracking-[0.14em] text-brand">LAYANAN SURAT</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-[-0.065em] text-ink sm:text-5xl">Pindah rumah, dengan alur yang jelas.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Ajukan data sekali. RT meninjau, meminta revisi bila perlu, lalu menerbitkan PDF bernomor yang siap dicetak.</p></section><div className="py-10 sm:py-12"><DocumentRequestForm type="move" /></div></div>;
}
