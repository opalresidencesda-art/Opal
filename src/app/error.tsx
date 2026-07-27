"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="bg-action text-ink-inverse">
      <div className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-16 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <WarningCircle size={42} weight="fill" className="text-brand-highlight" aria-hidden="true" />
          <p className="mt-8 text-xs font-extrabold tracking-[0.16em] text-brand-highlight">TERJADI KENDALA</p>
          <h1 className="public-display mt-5 text-4xl font-bold leading-[0.98] sm:text-5xl">Halaman belum bisa dimuat.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-ink-inverse/78">Coba muat kembali. Jika masalah berlanjut, silakan hubungi pengurus RT.</p>
          <button type="button" onClick={reset} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink-inverse px-5 text-sm font-bold text-action transition hover:-translate-y-1 hover:bg-brand-highlight active:translate-y-0"><ArrowClockwise size={17} weight="bold" aria-hidden="true" /> Coba lagi</button>
        </div>
      </div>
    </div>
  );
}
