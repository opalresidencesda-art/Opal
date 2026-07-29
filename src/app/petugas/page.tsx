import { ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { ServicePageHero } from "@/components/service-page-hero";
import { getPublishedStaff } from "@/lib/portal-services";

export const metadata = { title: "Petugas Pos & Taman" };

export default async function PetugasPage() {
  const staff = await getPublishedStaff();

  return (
    <div>
      <ServicePageHero kicker="OPERASIONAL LINGKUNGAN" title="Petugas Pos &amp; Taman." description="Hubungi petugas untuk koordinasi area bersama. Direktori hanya memuat kontak kerja yang tersedia untuk warga."><p className="text-sm font-semibold leading-6 text-ink-inverse/80">Saat menghubungi, sertakan gang dan nomor rumah agar koordinasi lebih cepat.</p></ServicePageHero>

      <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(13rem,0.35fr)_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <aside className="border-t border-line pt-6">
          <Phone size={24} weight="fill" className="text-brand" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-bold tracking-[-0.045em] text-ink">Kontak kerja yang tersedia</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Gunakan WhatsApp untuk keperluan operasional. Mohon sertakan blok dan nomor rumah saat menghubungi.</p>
        </aside>

        <div className="border-t border-line">
          {staff.length ? (
            staff.map((person) => (
              <article key={person.id ?? person.name} className="public-row-link border-b border-line py-7 pl-4 sm:pl-5">
                <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                  <div className="relative size-20 overflow-hidden rounded-full border border-line bg-brand-soft sm:size-20">
                    {person.id && person.photoPath ? <Image src={`/api/staff-photo/${person.id}`} alt={`Foto ${person.name}`} fill sizes="80px" className="object-cover" /> : <span className="grid size-full place-items-center text-2xl font-extrabold text-brand-deep" aria-hidden="true">{person.name.slice(0, 1).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0">
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
                </div>
              </article>
            ))
          ) : <p className="border-b border-line py-8 text-sm leading-6 text-ink-muted">Kontak petugas belum diterbitkan. RT akan memperbarui halaman ini saat informasi kerja tersedia.</p>}
        </div>
      </section>
    </div>
  );
}
