import { ArrowUpRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-raised" aria-label="Informasi OPAL Residence">
      <div className="mx-auto grid max-w-[1440px] gap-11 px-5 py-12 sm:px-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr] lg:gap-12 lg:px-10 lg:py-14">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-md text-[0.95rem] leading-7 text-ink-muted">
            Pusat informasi dan layanan warga OPAL Residence, Sidoarjo.
          </p>
          <p className="mt-4 flex max-w-md items-start gap-2.5 text-[0.95rem] leading-7 text-ink-muted">
            <MapPin className="mt-1 shrink-0 text-brand" size={18} weight="fill" aria-hidden="true" />
            Jl. Delima Selatan, Tambaksari, Tambakrejo, Waru, Sidoarjo, Jawa Timur 61256
          </p>
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-ink">Akses cepat</h2>
          <ul className="mt-3 space-y-1 text-[0.95rem] font-semibold text-ink-muted">
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised" href="/panduan-harmonis">Panduan harmonis</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised" href="/kas">Kas OPAL</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised" href="/pendataan-warga">Pendataan warga</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised" href="/layanan">Layanan warga</Link></li>
            <li><Link className="inline-flex min-h-11 items-center rounded-lg px-1 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised" href="/admin">Admin RT</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-[0.95rem] font-bold text-ink">Masa transisi</h2>
          <a
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[0.95rem] font-bold text-brand-deep transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised"
            href="https://linktr.ee/opalresidence"
            target="_blank"
            rel="noreferrer"
          >
            Buka Linktree OPAL <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          </a>
          <p className="mt-3 max-w-xs text-[0.95rem] leading-7 text-ink-muted">Tetap aktif selama seluruh informasi dipindahkan ke portal ini.</p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 text-center text-sm font-medium leading-6 text-ink-muted sm:px-8">
        Hak cipta {new Date().getFullYear()} OPAL Residence. Informasi dikelola oleh RT OPAL.
      </div>
    </footer>
  );
}
