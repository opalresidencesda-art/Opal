import { getPublishedHomeSpecs } from "@/lib/portal-services";

export const metadata = { title: "Spesifikasi Rumah" };

const categories = ["Keramik", "Cat", "Kontak"] as const;

export default async function SpesifikasiRumahPage() {
  const specs = await getPublishedHomeSpecs();

  return (
    <div>
      <section className="border-b border-line bg-surface-subtle">
        <div className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
          <p className="text-sm font-bold text-brand">Referensi rumah</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl">Spesifikasi yang mudah ditemukan saat dibutuhkan.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Rujukan material asli OPAL. Periksa kondisi lapangan serta konsultasikan kebutuhan renovasi dengan RT sebelum pekerjaan dimulai.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(13rem,0.35fr)_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <aside className="border-t border-line pt-6">
          <h2 className="text-xl font-bold tracking-[-0.045em] text-ink">Gunakan sebagai rujukan</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Catat merek dan kode material sebelum membeli. Detail ini membantu hasil renovasi tetap selaras dengan rumah OPAL.</p>
        </aside>

        <div className="grid gap-11">
          {categories.map((category) => {
            const items = specs.filter((item) => item.category === category);

            if (!items.length) return null;

            return (
              <section key={category} aria-labelledby={`spec-${category.toLowerCase()}`} className="border-t border-line pt-6">
                <h2 id={`spec-${category.toLowerCase()}`} className="text-2xl font-bold tracking-[-0.055em] text-ink">{category}</h2>
                <dl className="mt-5 border-t border-line">
                  {items.map((item) => (
                    <div key={item.id ?? `${item.category}-${item.label}`} className="grid gap-2 border-b border-line py-5 sm:grid-cols-[minmax(11rem,0.38fr)_minmax(0,1fr)] sm:gap-8">
                      <dt className="text-sm font-bold text-ink">{item.label}</dt>
                      <dd className="text-sm leading-6 text-ink-muted">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
          {!specs.length ? <p className="border-t border-line py-7 text-sm leading-6 text-ink-muted">Spesifikasi rumah belum diterbitkan. RT akan menampilkan rujukan material setelah data diverifikasi.</p> : null}
        </div>
      </section>
    </div>
  );
}
