import { ArrowRight, Bank } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { FeeSchedule } from "@/lib/content";
import { formatDate, formatRupiah, getActiveFees } from "@/lib/format";

export function FeeList({ fees, compact = false }: { fees: FeeSchedule[]; compact?: boolean }) {
  const activeFees = getActiveFees(fees);

  return (
    <div>
      {!compact ? (
        <div className="mb-9">
          <div>
            <p className="text-sm font-semibold text-brand">Iuran aktif</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-ink sm:text-3xl">Per rumah, per bulan</h2>
          </div>
        </div>
      ) : null}
      <div>
        {activeFees.map((fee) => (
          <article key={fee.id ?? fee.label} className="border-t border-line py-7 first:border-t-0 first:pt-0 sm:py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
              <h3 className="text-[0.98rem] font-bold text-ink">{fee.label}</h3>
              <p className="text-xl font-bold tracking-[-0.055em] text-brand-deep sm:text-2xl">{formatRupiah(fee.amountRupiah)}</p>
            </div>
            <p className="mt-2 max-w-xl text-base leading-7 text-ink-muted">{fee.description}</p>
            {!compact ? (
              <div className="mt-5 grid gap-1.5 text-base leading-7">
                <p className="flex items-center gap-2 font-semibold text-ink"><Bank size={17} className="text-brand" aria-hidden="true" /> {fee.paymentMethod}</p>
                <p className="text-ink-muted">{fee.destination}</p>
                <p className="text-xs font-medium text-ink-faint">Berlaku sejak {formatDate(fee.effectiveFrom)}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!compact ? (
        <Link href="/panduan-harmonis#iuran" className="mt-6 inline-flex min-h-11 items-center gap-2 text-base font-bold text-brand-deep hover:gap-3 hover:text-brand">
          Lihat panduan pembayaran <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
