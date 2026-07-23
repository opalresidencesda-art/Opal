import { DocumentRequestForm } from "@/components/document-request-form";
import { ServicePageHero } from "@/components/service-page-hero";

export const metadata = { title: "Surat Keterangan Belum Menikah" };

export default function BelumMenikahPage() {
  return <><ServicePageHero kicker="LAYANAN SURAT" title="Keterangan belum menikah, siap diperiksa RT." description="Setelah disetujui RT, nomor surat dibuat otomatis dan PDF diarsipkan privat sampai dicetak serta ditandatangani manual."><p className="text-sm font-semibold leading-6 text-ink-inverse/80">Tidak ada KTP atau KK yang diunggah untuk layanan ini. Pengurus memeriksa data sebelum menerbitkan surat.</p></ServicePageHero><div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14"><DocumentRequestForm type="single" /></div></>;
}
