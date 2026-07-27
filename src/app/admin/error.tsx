"use client";

import { ArrowClockwise, House, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto flex min-h-[62vh] max-w-[1440px] items-center px-5 py-14 sm:px-8 lg:px-10"><section className="max-w-2xl border-l-2 border-danger bg-danger-soft px-7 py-8 sm:px-9 sm:py-10" role="alert"><WarningCircle size={36} weight="fill" className="text-danger" aria-hidden="true" /><p className="mt-7 text-sm font-semibold text-danger-deep">Perlu dimuat ulang</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-ink">Ruang kerja RT belum dapat dibuka sepenuhnya.</h1><p className="mt-4 max-w-xl leading-7 text-ink-muted">Data tidak disimpan bila proses belum selesai. Periksa koneksi atau konfigurasi Supabase, lalu coba lagi. Jika masalah berulang, catat langkah terakhir sebelum halaman ini muncul.</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-on-action transition hover:bg-brand hover:text-on-brand"><ArrowClockwise size={18} weight="bold" aria-hidden="true" /> Coba lagi</button><Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand"><House size={18} weight="bold" aria-hidden="true" /> Ke portal warga</Link></div></section></div>;
}
