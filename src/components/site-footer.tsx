import { ArrowUpRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-action text-ink-inverse" aria-label="Informasi OPAL Residence">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.4fr_0.72fr_0.72fr] lg:gap-16 lg:px-10 lg:py-24">
        <div>
          <BrandMark inverse />
          <p className="public-display mt-8 max-w-xl text-3xl font-bold leading-[1.03] text-ink-inverse sm:text-4xl">
            Pengumuman, iuran, panduan, dan layanan warga dikelola pengurus RT.
          </p>
          <p className="mt-6 flex max-w-lg items-start gap-2.5 text-[0.95rem] leading-7 text-ink-inverse/65">
            <MapPin className="mt-1 shrink-0 text-brand-highlight" size={18} weight="fill" aria-hidden="true" />
            Jl. Delima Selatan, Tambaksari, Tambakrejo, Waru, Sidoarjo, Jawa Timur 61256
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-brand-highlight">Akses cepat</h2>
          <ul className="mt-4 space-y-1 text-[0.95rem] font-semibold text-ink-inverse/72">
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action" href="/panduan-harmonis">Panduan harmonis</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action" href="/kas">Kas OPAL</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action" href="/pendataan-warga">Pendataan warga</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action" href="/admin">Admin RT</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-brand-highlight">Masa transisi</h2>
          <a
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[0.95rem] font-bold text-brand-highlight transition-colors hover:text-ink-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action"
            href="https://linktr.ee/opalresidence"
            target="_blank"
            rel="noreferrer"
          >
            Buka Linktree OPAL <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          </a>
          <p className="mt-3 max-w-xs text-[0.95rem] leading-7 text-ink-inverse/75">Tetap aktif selama seluruh informasi dipindahkan ke portal ini.</p>
        </div>
      </div>
      <div className="border-t border-white/12 px-5 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-6 text-center text-sm font-medium leading-6 text-ink-inverse/55 sm:px-8 sm:py-6">
        Hak cipta {new Date().getFullYear()} OPAL Residence. Informasi dikelola oleh RT OPAL.
      </div>
    </footer>
  );
}
