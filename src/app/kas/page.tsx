import { ArrowDownLeft, ArrowUpRight, Bank, CalendarBlank, Wallet } from "@phosphor-icons/react/dist/ssr";
import { FeeList } from "@/components/fee-list";
import { formatDate, formatRupiah } from "@/lib/format";
import { getPortalData } from "@/lib/data";
import { getPublicCashSummary } from "@/lib/portal-services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kas OPAL", description: "Ringkasan Kas OPAL dan informasi iuran warga." };

export default async function KasPage() {
  const [summary, portal] = await Promise.all([getPublicCashSummary(), getPortalData()]);
  const hasData = summary.income || summary.expense;

  return (
    <div>
      <section className="border-b border-line bg-surface-subtle">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:items-end lg:px-10 lg:py-16">
          <div>
            <p className="text-sm font-bold text-brand">Kas OPAL</p>
            <h1 className="mt-3 max-w-4xl text-balance text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl lg:text-6xl">
              Kas yang bisa dibaca warga.
            </h1>
          </div>
          <p className="max-w-md border-l-2 border-brand pl-4 text-base leading-7 text-ink-muted">
            Ringkasan publik dibuat untuk transparansi. Riwayat iuran setiap rumah tetap tersedia melalui tautan privat dari RT.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid overflow-hidden rounded-[16px] border border-line bg-surface-raised lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2 text-sm font-bold text-ink-muted">
              <Wallet size={18} weight="fill" className="text-brand" aria-hidden="true" />
              Saldo ringkasan
            </div>
            <p className="mt-7 text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl">{formatRupiah(summary.balance)}</p>
            {summary.lastUpdated ? <p className="mt-4 text-sm text-ink-muted">Per {formatDate(summary.lastUpdated)}</p> : <p className="mt-4 text-sm text-ink-muted">Akan diperbarui setelah pembukuan publik diterbitkan.</p>}
          </div>
          <dl className="border-t border-line lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between gap-5 border-b border-line px-6 py-6 sm:px-8">
              <dt className="flex items-center gap-2 text-sm font-bold text-ink-muted">
                <ArrowDownLeft size={18} weight="bold" className="text-brand" aria-hidden="true" />
                Pemasukan publik
              </dt>
              <dd className="text-xl font-bold tracking-[-0.05em] text-ink">{formatRupiah(summary.income)}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 px-6 py-6 sm:px-8">
              <dt className="flex items-center gap-2 text-sm font-bold text-ink-muted">
                <ArrowUpRight size={18} weight="bold" className="text-brand" aria-hidden="true" />
                Pengeluaran publik
              </dt>
              <dd className="text-xl font-bold tracking-[-0.05em] text-ink">{formatRupiah(summary.expense)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-5 pb-12 sm:px-8 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)] lg:px-10 lg:pb-16">
        <aside>
          <FeeList fees={portal.fees} />
          <div className="mt-8 border-t border-line pt-6">
            <div className="flex items-start gap-3">
              <Bank size={23} className="mt-0.5 shrink-0 text-brand" weight="fill" aria-hidden="true" />
              <div>
                <h2 className="font-bold tracking-[-0.03em] text-ink">Pembayaran Kas OPAL</h2>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">BCA 1011815125 a.n. Neria Kezia Jayanti. Konfirmasikan metode pembayaran yang berlaku kepada pengurus.</p>
              </div>
            </div>
          </div>
        </aside>

        <section aria-labelledby="cash-categories-heading" className="border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="cash-categories-heading" className="text-2xl font-bold tracking-[-0.055em] text-ink">Kategori pembukuan</h2>
            {summary.lastUpdated ? <span className="flex items-center gap-1.5 text-xs font-bold text-ink-faint"><CalendarBlank size={15} aria-hidden="true" /> Diperbarui</span> : null}
          </div>
          {hasData ? (
            <div className="mt-5 border-t border-line">
              {summary.categories.map((item) => (
                <article key={item.category} className="grid gap-3 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-8">
                  <h3 className="font-bold text-ink">{item.category}</h3>
                  <p className="text-sm text-ink-muted">Masuk <strong className="font-bold text-ink">{formatRupiah(item.income)}</strong></p>
                  <p className="text-sm text-ink-muted">Keluar <strong className="font-bold text-ink">{formatRupiah(item.expense)}</strong></p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 border-t border-line py-7 text-sm leading-6 text-ink-muted">Pembukuan publik belum diterbitkan. RT akan menampilkan ringkasan setelah data Kas lama selesai direkonsiliasi.</p>
          )}
        </section>
      </section>
    </div>
  );
}
