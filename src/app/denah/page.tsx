import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { ServicePageHero } from "@/components/service-page-hero";
import { getPublishedFloorPlans } from "@/lib/portal-services";

export const metadata = { title: "Denah OPAL Tipe 6 x 12" };

const galleryPlacement = ["lg:col-span-7", "lg:col-span-5 lg:mt-12", "lg:col-span-5", "lg:col-span-7 lg:mt-12"];

export default async function DenahPage() {
  const databasePlans = await getPublishedFloorPlans();
  const plans = databasePlans.map((plan) => ({ title: plan.title, src: `/api/aset/${plan.id}`, alt: plan.altText }));

  return (
    <div>
      <ServicePageHero
        kicker="REFERENSI RUMAH"
        title="Denah OPAL Tipe 6 x 12."
        description="Empat lembar denah asli dalam galeri web. Gunakan sebagai referensi, bukan pengganti persetujuan renovasi."
      />

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        {plans.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:gap-7">
            {plans.map((plan, index) => (
              <figure key={plan.title} className={`${galleryPlacement[index % galleryPlacement.length]} overflow-hidden rounded-[16px] border border-line bg-surface-raised`}>
                <div className="relative aspect-[1.24] bg-surface-subtle p-3 sm:p-5">
                  <Image
                    src={plan.src}
                    alt={plan.alt}
                    fill
                    priority={index === 0}
                    sizes={index % 4 === 0 || index % 4 === 3 ? "(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw"}
                    className="object-contain"
                  />
                </div>
                <figcaption className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><span className="text-base font-bold text-ink">{plan.title}</span><a href={plan.src} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-deep hover:text-brand">Buka ukuran penuh <ArrowUpRight size={16} weight="bold" aria-hidden="true" /></a></figcaption>
              </figure>
            ))}
          </div>
        ) : <p className="rounded-[16px] border border-line bg-surface-raised px-5 py-8 text-sm leading-6 text-ink-muted">Denah rumah belum dipublikasikan dari portal admin. RT akan menampilkan lembar resmi setelah arsip siap dibagikan.</p>}
      </section>
    </div>
  );
}
