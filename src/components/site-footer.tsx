import { ArrowUpRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface-subtle">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.35fr_0.8fr_0.8fr] lg:px-10 lg:py-16">
        <div>
          <BrandMark />
          <p className="mt-6 max-w-md text-sm leading-6 text-ink-muted">
            Pusat informasi dan layanan warga OPAL Residence, Sidoarjo.
          </p>
          <p className="mt-4 flex max-w-md gap-2.5 text-sm leading-6 text-ink-muted">
            <MapPin className="mt-0.5 shrink-0 text-brand" size={17} weight="fill" aria-hidden="true" />
            Jl. Delima Selatan, Tambaksari, Tambakrejo, Waru, Sidoarjo, Jawa Timur 61256
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Akses cepat</h2>
          <ul className="mt-5 space-y-3.5 text-sm font-semibold text-ink-muted">
            <li><Link className="hover:text-brand" href="/panduan-harmonis">Panduan harmonis</Link></li>
            <li><Link className="hover:text-brand" href="/kas">Kas OPAL</Link></li>
            <li><Link className="hover:text-brand" href="/pendataan-warga">Pendataan warga</Link></li>
            <li><Link className="hover:text-brand" href="/layanan">Layanan warga</Link></li>
            <li><Link className="hover:text-brand" href="/admin">Admin RT</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-ink">Masa transisi</h2>
          <a
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-deep hover:text-brand"
            href="https://linktr.ee/opalresidence"
            target="_blank"
            rel="noreferrer"
          >
            Buka Linktree OPAL <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          </a>
          <p className="mt-3 max-w-xs text-sm leading-6 text-ink-muted">Tetap aktif selama seluruh informasi dipindahkan ke portal ini.</p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 text-center text-xs font-medium text-ink-muted sm:px-8">
        © {new Date().getFullYear()} OPAL Residence. Informasi dikelola oleh RT OPAL.
      </div>
    </footer>
  );
}
