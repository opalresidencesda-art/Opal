"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-10">
      <div className="max-w-xl">
        <WarningCircle size={40} weight="fill" className="text-brand" aria-hidden="true" />
        <p className="mt-7 text-sm font-semibold text-brand">Terjadi kendala</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.06em] text-ink">Halaman belum bisa dimuat.</h1>
        <p className="mt-4 leading-7 text-ink-muted">Coba muat kembali. Jika masalah berlanjut, silakan hubungi pengurus RT.</p>
        <button type="button" onClick={reset} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0"><ArrowClockwise size={17} weight="bold" aria-hidden="true" /> Coba lagi</button>
      </div>
    </main>
  );
}
