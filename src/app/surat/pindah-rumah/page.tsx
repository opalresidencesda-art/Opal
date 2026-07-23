import { DocumentRequestForm } from "@/components/document-request-form";
import { ServicePageHero } from "@/components/service-page-hero";

export const metadata = { title: "Surat Keterangan Pindah Rumah" };

export default function PindahRumahPage() {
  return <><ServicePageHero kicker="LAYANAN SURAT" title="Pindah rumah, dengan alur yang jelas." description="Ajukan data sekali. RT meninjau, meminta revisi bila perlu, lalu menerbitkan PDF bernomor yang siap dicetak."><p className="text-sm font-semibold leading-6 text-ink-inverse/80">Setelah diterbitkan, surat dicetak lalu dibubuhi tanda tangan dan stempel manual oleh RT.</p></ServicePageHero><div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14"><DocumentRequestForm type="move" /></div></>;
}
