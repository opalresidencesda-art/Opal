import { ArrowDownLeft, ArrowUpRight, Bank, Wallet } from "@phosphor-icons/react/dist/ssr";
import { FeeList } from "@/components/fee-list";
import { PublicCashCategoryBrowser } from "@/components/public-cash-category-browser";
import { ServicePageHero } from "@/components/service-page-hero";
import { formatDate, formatRupiah } from "@/lib/format";
import { getPortalData } from "@/lib/data";
import { getPublicCashSummary } from "@/lib/portal-services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kas OPAL", description: "Ringkasan Kas OPAL dan informasi iuran warga." };

export default async function KasPage() {
  const [summary, portal] = await Promise.all([getPublicCashSummary(), getPortalData()]);

  return (
    <div>
      <ServicePageHero
        kicker="KAS OPAL"
        title="Kas yang bisa dibaca warga."
        description="Ringkasan publik untuk transparansi. Riwayat setiap rumah tetap tersedia melalui tautan privat dari RT."
      />

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid border-b border-line lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)]">
          <div className="py-8 sm:py-10 lg:py-12">
            <div className="flex items-center gap-2 text-sm font-bold text-ink-muted">
              <Wallet size={18} weight="fill" className="text-brand" aria-hidden="true" />
              Saldo ringkasan
            </div>
            <p className="mt-7 text-4xl font-bold tracking-[-0.07em] text-ink sm:text-5xl">{formatRupiah(summary.balance)}</p>
            {summary.lastUpdated ? <p className="mt-4 text-sm text-ink-muted">Per {formatDate(summary.lastUpdated)}</p> : <p className="mt-4 text-sm text-ink-muted">Akan diperbarui setelah pembukuan publik diterbitkan.</p>}
          </div>
          <dl className="border-t border-line bg-surface-subtle lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between gap-5 border-b border-line px-5 py-6 sm:px-8">
              <dt className="flex items-center gap-2 text-sm font-bold text-ink-muted">
                <ArrowDownLeft size={18} weight="bold" className="text-brand" aria-hidden="true" />
                Pemasukan publik
              </dt>
              <dd className="text-xl font-bold tracking-[-0.05em] text-ink">{formatRupiah(summary.income)}</dd>
            </div>
            <div className="flex items-center justify-between gap-5 px-5 py-6 sm:px-8">
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

        <PublicCashCategoryBrowser categories={summary.categories} lastUpdated={summary.lastUpdated} />
      </section>
    </div>
  );
}
