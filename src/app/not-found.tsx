import { ArrowLeft, MapTrifold } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-10">
      <div className="max-w-xl">
        <MapTrifold size={40} weight="fill" className="text-brand" aria-hidden="true" />
        <p className="mt-7 text-sm font-semibold text-brand">404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.06em] text-ink">Halaman ini tidak ditemukan.</h1>
        <p className="mt-4 leading-7 text-ink-muted">Mungkin tautannya sudah berubah atau alamatnya kurang lengkap. Kembali ke portal untuk memilih layanan yang diperlukan.</p>
        <Link href="/" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 text-sm font-bold text-on-action transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0"><ArrowLeft size={17} weight="bold" aria-hidden="true" /> Kembali ke beranda</Link>
      </div>
    </div>
  );
}
