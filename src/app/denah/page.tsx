import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { getPublishedFloorPlans } from "@/lib/portal-services";

export const metadata = { title: "Denah OPAL Tipe 6 x 12" };

const localPlans = [
  { title: "Saluran air kotor lantai 1 & 2", src: "/images/denah/opal-denah-1.png", alt: "Denah saluran air kotor rumah OPAL tipe 6 x 12" },
  { title: "Saluran air bersih lantai 1 & 2", src: "/images/denah/opal-denah-2.png", alt: "Denah saluran air bersih rumah OPAL tipe 6 x 12" },
  { title: "Denah lantai 1 & 2", src: "/images/denah/opal-denah-3.png", alt: "Denah lantai satu dan dua rumah OPAL tipe 6 x 12" },
  { title: "Plafond & titik lampu", src: "/images/denah/opal-denah-4.png", alt: "Denah plafon dan titik lampu rumah OPAL tipe 6 x 12" },
];

const galleryPlacement = ["lg:col-span-7", "lg:col-span-5 lg:mt-12", "lg:col-span-5", "lg:col-span-7 lg:mt-12"];

export default async function DenahPage() {
  const databasePlans = await getPublishedFloorPlans();
  const plans = databasePlans.length ? databasePlans.map((plan) => ({ title: plan.title, src: `/api/aset/${plan.id}`, alt: plan.altText })) : localPlans;

  return (
    <div>
      <section className="border-b border-line bg-surface-subtle">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:items-end lg:px-10 lg:py-16">
          <div>
            <p className="text-sm font-bold text-brand">Referensi rumah</p>
            <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl">Denah OPAL Tipe 6 x 12.</h1>
          </div>
          <p className="max-w-md border-l-2 border-brand pl-4 text-base leading-7 text-ink-muted">Empat lembar denah asli tersedia sebagai galeri web. Gunakan sebagai referensi, bukan pengganti persetujuan renovasi.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
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
      </section>
    </div>
  );
}
