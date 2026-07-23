import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center border-l-[3px] border-brand pl-3.5 pr-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
    >
      <span className="leading-none">
        <span className="block text-[1.24rem] font-extrabold tracking-[-0.075em]">OPAL</span>
        <span className="mt-1.5 block text-[0.625rem] font-bold tracking-[0.17em] text-ink-muted">{compact ? "RESIDENCE" : "RESIDENCE, SIDOARJO"}</span>
      </span>
    </Link>
  );
}
