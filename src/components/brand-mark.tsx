import { House } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3 text-ink focus-visible:outline-none">
      <span className="grid size-10 place-items-center rounded-[13px] bg-brand text-ink-inverse shadow-[0_10px_28px_rgba(5,87,79,0.2)] transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0">
        <House size={20} weight="fill" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className="block text-[9px] font-bold tracking-[0.16em] text-ink-muted">RUKUN TETANGGA</span>
        <span className="mt-1 block text-[1.05rem] font-extrabold tracking-[-0.065em]">OPAL{compact ? "" : " RESIDENCE"}</span>
      </span>
    </Link>
  );
}
