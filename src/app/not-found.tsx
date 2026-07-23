import { ArrowLeft, MapTrifold } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-action text-ink-inverse">
      <div className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <MapTrifold size={42} weight="fill" className="text-brand-soft" aria-hidden="true" />
          <p className="mt-8 text-xs font-extrabold tracking-[0.16em] text-brand-soft">404</p>
          <h1 className="public-display mt-5 text-4xl font-bold leading-[0.98] sm:text-5xl">Halaman ini tidak ditemukan.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink-inverse/78">Mungkin tautannya sudah berubah atau alamatnya kurang lengkap. Kembali ke portal untuk memilih layanan yang diperlukan.</p>
          <Link href="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-surface-raised px-5 text-sm font-bold text-action transition hover:-translate-y-1 hover:bg-brand-soft active:translate-y-0"><ArrowLeft size={17} weight="bold" aria-hidden="true" /> Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
