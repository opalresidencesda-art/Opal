import { DocumentRequestForm } from "@/components/document-request-form";
import { ServicePageHero } from "@/components/service-page-hero";

export const metadata = { title: "Surat Keterangan Domisili" };

export default function DomisiliPage() {
  return <><ServicePageHero kicker="LAYANAN SURAT" title="Surat domisili, tanpa memulai dari dokumen kosong." description="Data dikirim langsung ke antrean RT dan tidak memerlukan unggahan KTP atau KK."><p className="text-sm font-semibold leading-6 text-ink-inverse/80">RT memeriksa kesesuaian data domisili sebelum nomor surat dan PDF diterbitkan.</p></ServicePageHero><div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14"><DocumentRequestForm type="domicile" /></div></>;
}
