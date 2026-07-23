import Link from "next/link";

export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center border-l-[3px] border-brand pl-3.5 pr-2 ${inverse ? "text-ink-inverse focus-visible:ring-brand-soft focus-visible:ring-offset-action" : "text-ink focus-visible:ring-brand focus-visible:ring-offset-surface"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4`}
    >
      <span className="leading-none">
        <span className="block text-[1.24rem] font-extrabold tracking-[-0.075em]">OPAL</span>
        <span className={`mt-1.5 block text-[0.625rem] font-bold tracking-[0.17em] ${inverse ? "text-ink-inverse/65" : "text-ink-muted"}`}>{compact ? "RESIDENCE" : "RESIDENCE, SIDOARJO"}</span>
      </span>
    </Link>
  );
}
