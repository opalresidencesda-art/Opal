import Image from "next/image";
import { getPublishedFloorPlans } from "@/lib/portal-services";

export const metadata = { title: "Denah OPAL Tipe 6 x 12" };

const localPlans = [
  { title: "Saluran air kotor lantai 1 & 2", src: "/images/denah/opal-denah-1.png", alt: "Denah saluran air kotor rumah OPAL tipe 6 x 12" },
  { title: "Saluran air bersih lantai 1 & 2", src: "/images/denah/opal-denah-2.png", alt: "Denah saluran air bersih rumah OPAL tipe 6 x 12" },
  { title: "Denah lantai 1 & 2", src: "/images/denah/opal-denah-3.png", alt: "Denah lantai satu dan dua rumah OPAL tipe 6 x 12" },
  { title: "Plafond & titik lampu", src: "/images/denah/opal-denah-4.png", alt: "Denah plafon dan titik lampu rumah OPAL tipe 6 x 12" },
];

export default async function DenahPage() {
  const databasePlans = await getPublishedFloorPlans();
  const plans = databasePlans.length ? databasePlans.map((plan) => ({ title: plan.title, src: `/api/aset/${plan.id}`, alt: plan.altText })) : localPlans;
  return <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><p className="text-sm font-semibold text-brand">Referensi rumah</p><h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl">Denah OPAL Tipe 6 × 12.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Empat lembar denah asli tersedia sebagai galeri web agar nyaman dilihat dari ponsel. Gunakan sebagai referensi, bukan pengganti persetujuan renovasi.</p><div className="mt-11 grid gap-8 md:grid-cols-2">{plans.map((plan) => <figure key={plan.title} className="border border-line bg-surface-raised p-3 sm:p-4"><div className="relative aspect-[1.25] overflow-hidden bg-surface-subtle"><Image src={plan.src} alt={plan.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" /></div><figcaption className="px-1 pt-4 pb-1 text-sm font-bold text-ink">{plan.title}</figcaption></figure>)}</div></main>;
}
