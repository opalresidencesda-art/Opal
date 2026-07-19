import { FileLock, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { ResidentDataForm } from "@/components/resident-data-form";

export const metadata = { title: "Pendataan Warga", description: "Pendataan satu rumah per pengisian untuk warga OPAL Residence." };

export default function PendataanWargaPage() {
  return <main className="mx-auto max-w-[1040px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
    <section className="border-b border-line pb-9">
      <p className="text-sm font-semibold text-brand">Pendataan warga</p>
      <h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl lg:text-6xl">Data satu rumah, diperlakukan dengan semestinya.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">Formulir ini menggantikan Form Dokumen Warga OPAL. Isi satu kali untuk satu rumah yang menjadi tanggung jawab Anda.</p>
      <div className="mt-8 grid gap-4 border-y border-line py-5 sm:grid-cols-2">
        <p className="flex gap-3 text-sm leading-6 text-ink-muted"><FileLock className="mt-0.5 shrink-0 text-brand" size={21} weight="fill" aria-hidden="true" />KTP dan KK disimpan pada penyimpanan privat. Berkas tidak tersedia untuk publik maupun tautan rumah.</p>
        <p className="flex gap-3 text-sm leading-6 text-ink-muted"><ShieldCheck className="mt-0.5 shrink-0 text-brand" size={21} weight="fill" aria-hidden="true" />Anda menerima tanda terima email tanpa data identitas atau lampiran sensitif.</p>
      </div>
    </section>
    <section className="py-10 sm:py-12"><ResidentDataForm /></section>
  </main>;
}
