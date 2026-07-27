import { FileLock, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { ResidentDataForm } from "@/components/resident-data-form";
import { ServicePageHero } from "@/components/service-page-hero";

export const metadata = { title: "Pendataan Warga", description: "Pendataan satu rumah per pengisian untuk warga OPAL Residence." };

export default function PendataanWargaPage() {
  return <><ServicePageHero kicker="PENDATAAN WARGA" title="Lengkapi data untuk satu rumah." description="Formulir ini menggantikan Form Dokumen Warga OPAL. Isi satu kali untuk satu rumah yang menjadi tanggung jawab Anda."><div className="grid gap-5 sm:grid-cols-2"><p className="flex gap-3 text-sm leading-6 text-ink-inverse/80"><FileLock className="mt-0.5 shrink-0 text-brand-highlight" size={21} weight="fill" aria-hidden="true" />KTP dan KK disimpan privat. Berkas tidak tersedia untuk publik maupun tautan rumah.</p><p className="flex gap-3 text-sm leading-6 text-ink-inverse/80"><ShieldCheck className="mt-0.5 shrink-0 text-brand-highlight" size={21} weight="fill" aria-hidden="true" />Tanda terima email tidak memuat data identitas atau lampiran sensitif.</p></div></ServicePageHero><div className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14"><div className="rounded-[16px] border border-line bg-surface-raised p-5 sm:p-8"><ResidentDataForm /></div></div></>;
}
