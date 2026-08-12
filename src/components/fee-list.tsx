import { ArrowRight, Bank } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { FeeSchedule } from "@/lib/content";
import { formatDate, formatRupiah, getActiveFees } from "@/lib/format";

type FeeListProps = {
  fees: FeeSchedule[];
  compact?: boolean;
  variant?: "default" | "guide" | "home";
};

function HomeFeeList({ fees, boxed = false }: { fees: FeeSchedule[]; boxed?: boolean }) {
  if (!fees.length) {
    return <p className="px-6 py-10 text-[0.82rem] leading-6 text-ink-muted sm:px-8 sm:py-12">Nominal iuran aktif akan ditampilkan setelah RT menerbitkannya.</p>;
  }

  return (
    <div className={boxed ? "" : "px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12"}>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand">Nominal aktif</p>
        <p className="text-[0.66rem] font-bold text-ink-faint">Per rumah / bulan</p>
      </div>

      <div className={boxed ? "mt-5 grid gap-4 xl:grid-cols-2" : ""}>
        {fees.map((fee, index) => (
          <article
            key={fee.id ?? fee.label}
            data-guide-fee-card={boxed ? "true" : undefined}
            className={`grid grid-cols-[1.35rem_minmax(0,1fr)] gap-x-3 gap-y-4 sm:grid-cols-[1.6rem_minmax(0,1fr)_auto] sm:gap-x-5 ${
              boxed
                ? "border border-line bg-surface p-5 sm:grid-cols-[1.6rem_minmax(0,1fr)] sm:p-6 xl:grid-cols-[1.6rem_minmax(0,1fr)]"
                : "border-t border-line py-6 first:border-t-0 sm:py-7"
            }`}
          >
            <p className="pt-0.5 text-[0.66rem] font-extrabold tracking-[0.08em] text-brand" aria-hidden="true">{String(index + 1).padStart(2, "0")}</p>
            <div className="min-w-0">
              <h3 className="break-words text-[0.96rem] font-extrabold tracking-[-0.04em] text-ink sm:text-[1.08rem]">{fee.label}</h3>
              <p className="mt-2 max-w-md break-words text-[0.76rem] leading-6 text-ink-muted sm:text-[0.82rem]">{fee.description}</p>
              <p className="mt-5 flex items-start gap-2 border-l-2 border-brand pl-3 text-[0.7rem] leading-5 text-ink-muted">
                <Bank className="mt-0.5 shrink-0 text-brand" size={15} weight="fill" aria-hidden="true" />
                <span className="break-words">{fee.paymentMethod}</span>
              </p>
            </div>
            <div className={`col-start-2 min-w-0 ${boxed ? "" : "sm:col-start-auto sm:text-right"}`}>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-faint">Berlaku sejak {formatDate(fee.effectiveFrom)}</p>
              <p className="public-display mt-2 whitespace-nowrap tabular-nums text-[1.9rem] font-bold leading-none text-brand-deep sm:text-[2.3rem]">{formatRupiah(fee.amountRupiah)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FeeList({ fees, compact = false, variant = "default" }: FeeListProps) {
  const activeFees = getActiveFees(fees);

  if (variant === "home" || variant === "guide") return <HomeFeeList fees={activeFees} boxed={variant === "guide"} />;
  if (!activeFees.length) {
    return (
      <div>
        {!compact ? (
          <div className="mb-9">
            <div>
              <p className="text-[0.7rem] font-semibold text-brand">Iuran aktif</p>
              <h2 className="mt-2 text-[1.2rem] font-bold tracking-[-0.05em] text-ink sm:text-2xl">Per rumah, per bulan</h2>
            </div>
          </div>
        ) : null}
        <p className="border-t border-line py-7 text-[0.8rem] leading-6 text-ink-muted">Nominal iuran aktif belum diterbitkan. RT akan menampilkan rincian setelah jadwal resmi dipublikasikan.</p>
      </div>
    );
  }

  return (
    <div>
      {!compact ? (
        <div className="mb-9">
          <div>
            <p className="text-[0.7rem] font-semibold text-brand">Iuran aktif</p>
            <h2 className="mt-2 text-[1.2rem] font-bold tracking-[-0.05em] text-ink sm:text-2xl">Per rumah, per bulan</h2>
          </div>
        </div>
      ) : null}
      <div>
        {activeFees.map((fee) => (
          <article key={fee.id ?? fee.label} className="border-t border-line py-7 first:border-t-0 first:pt-0 sm:py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
              <h3 className="text-[0.8rem] font-bold text-ink">{fee.label}</h3>
              <p className="text-base font-bold tracking-[-0.055em] text-brand-deep sm:text-[1.2rem]">{formatRupiah(fee.amountRupiah)}</p>
            </div>
            <p className="mt-2 max-w-xl text-[0.8rem] leading-6 text-ink-muted">{fee.description}</p>
            {!compact ? (
              <div className="mt-5 grid gap-1.5 text-[0.8rem] leading-6">
                <p className="flex items-center gap-2 font-semibold text-ink"><Bank size={17} className="text-brand" aria-hidden="true" /> {fee.paymentMethod}</p>
                <p className="text-ink-muted">{fee.destination}</p>
                <p className="text-[0.6rem] font-medium text-ink-faint">Berlaku sejak {formatDate(fee.effectiveFrom)}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {!compact ? (
        <Link href="/panduan-harmonis#iuran" className="mt-6 inline-flex min-h-11 items-center gap-2 text-[0.8rem] font-bold text-brand-deep hover:gap-3 hover:text-brand">
          Lihat panduan pembayaran <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
