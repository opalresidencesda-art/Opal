import { ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";
import { getPublishedStaff } from "@/lib/portal-services";

export const metadata = { title: "Petugas Pos & Taman" };

export default async function PetugasPage() {
  const staff = await getPublishedStaff();

  return (
    <div>
      <section className="border-b border-line bg-surface-subtle">
        <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-sm font-bold text-brand">Operasional lingkungan</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl">Petugas Pos &amp; Taman.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Hubungi petugas untuk koordinasi area bersama. Direktori hanya memuat kontak kerja yang tersedia untuk warga.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(13rem,0.35fr)_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <aside className="border-t border-line pt-6">
          <Phone size={24} weight="fill" className="text-brand" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-bold tracking-[-0.045em] text-ink">Kontak kerja yang tersedia</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Gunakan WhatsApp untuk keperluan operasional. Mohon sertakan blok dan nomor rumah saat menghubungi.</p>
        </aside>

        <div className="border-t border-line">
          {staff.length ? (
            staff.map((person) => (
              <article key={person.id ?? person.name} className="grid gap-5 border-b border-line py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <p className="text-sm font-bold text-brand">{person.role}</p>
                  <h3 className="mt-1 text-2xl font-bold tracking-[-0.05em] text-ink">{person.name}</h3>
                </div>
                {person.whatsapp ? (
                  <a href={`https://wa.me/${person.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-deep sm:w-auto">
                    <Phone size={17} weight="fill" aria-hidden="true" />
                    Hubungi WhatsApp
                    <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
                  </a>
                ) : <span className="text-sm font-semibold text-ink-faint">Kontak belum tersedia</span>}
              </article>
            ))
          ) : <p className="border-b border-line py-8 text-sm leading-6 text-ink-muted">Kontak petugas belum diterbitkan. RT akan memperbarui halaman ini saat informasi kerja tersedia.</p>}
        </div>
      </section>
    </div>
  );
}
