import { ArrowRight, Bank, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { FeeSchedule } from "@/lib/content";
import { formatDate, formatRupiah, getActiveFees } from "@/lib/format";

export function FeeList({ fees, compact = false }: { fees: FeeSchedule[]; compact?: boolean }) {
  const activeFees = getActiveFees(fees);

  return (
    <div className={compact ? "" : "border-t-2 border-brand pt-5 sm:pt-7"}>
      {!compact ? (
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">Iuran aktif</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.055em] text-ink sm:text-3xl">Per rumah, per bulan</h2>
          </div>
          <ShieldCheck size={28} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />
        </div>
      ) : null}
      <div className="divide-y divide-line border-y border-line">
        {activeFees.map((fee) => (
          <article key={fee.id ?? fee.label} className="py-4 first:pt-0 last:pb-0 sm:py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
              <h3 className="text-[0.98rem] font-bold text-ink">{fee.label}</h3>
              <p className="text-xl font-extrabold tracking-[-0.055em] text-brand-deep sm:text-2xl">{formatRupiah(fee.amountRupiah)}</p>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">{fee.description}</p>
            {!compact ? (
              <div className="mt-4 grid gap-1.5 border-l border-brand/45 pl-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-ink"><Bank size={17} className="text-brand" aria-hidden="true" /> {fee.paymentMethod}</p>
                <p className="text-ink-muted">{fee.destination}</p>
                <p className="text-xs font-medium text-ink-faint">Berlaku sejak {formatDate(fee.effectiveFrom)}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!compact ? (
        <Link href="/panduan-harmonis#iuran" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-deep hover:gap-3 hover:text-brand">
          Lihat panduan pembayaran <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
