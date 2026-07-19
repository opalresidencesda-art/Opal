import { getPublishedHomeSpecs } from "@/lib/portal-services";

export const metadata = { title: "Spesifikasi Rumah" };

export default async function SpesifikasiRumahPage() {
  const specs = await getPublishedHomeSpecs();
  const categories = ["Keramik", "Cat", "Kontak"] as const;
  return <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><p className="text-sm font-semibold text-brand">Referensi rumah</p><h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl">Spesifikasi yang mudah ditemukan saat dibutuhkan.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Rujukan material asli OPAL. Periksa kondisi lapangan serta konsultasikan kebutuhan renovasi dengan RT sebelum pekerjaan dimulai.</p><div className="mt-11 grid gap-11">{categories.map((category) => { const items = specs.filter((item) => item.category === category); return items.length ? <section key={category} className="grid gap-5 border-t border-line pt-7 lg:grid-cols-[0.34fr_1fr]"><div><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">{category}</h2></div><div className="divide-y divide-line border-y border-line">{items.map((item) => <div key={item.id ?? `${item.category}-${item.label}`} className="grid gap-1 py-4 sm:grid-cols-[0.38fr_1fr] sm:gap-6"><p className="text-sm font-bold text-ink">{item.label}</p><p className="text-sm leading-6 text-ink-muted">{item.value}</p></div>)}</div></section> : null; })}</div></main>;
}
