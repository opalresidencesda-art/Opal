"use client";

import { ArrowDownLeft, ArrowUpRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { filterPublicCashCategories, type CashCategoryDirection, type CashCategoryTotals } from "@/lib/cash";
import { formatDate, formatRupiah } from "@/lib/format";

const PREVIEW_LIMIT = 7;

const directionOptions: Array<{ value: CashCategoryDirection; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Uang masuk" },
  { value: "expense", label: "Uang keluar" },
];

export function PublicCashCategoryBrowser({ categories, lastUpdated }: { categories: CashCategoryTotals[]; lastUpdated: string | null }) {
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<CashCategoryDirection>("all");
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => filterPublicCashCategories(categories, query, direction), [categories, direction, query]);
  const isNarrowed = Boolean(query.trim()) || direction !== "all";
  const visible = isNarrowed || showAll ? filtered : filtered.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(filtered.length - visible.length, 0);

  return (
    <section aria-labelledby="cash-categories-heading" className="overflow-hidden rounded-[1.5rem] border border-line bg-surface-raised shadow-[0_18px_55px_rgba(5,45,39,0.06)]">
      <header className="border-b border-line px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="public-kicker">Rincian transparansi</p>
            <h2 id="cash-categories-heading" className="mt-2 text-2xl font-bold tracking-[-0.055em] text-ink sm:text-[1.7rem]">Kategori pembukuan</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Cari pos Kas tertentu atau lihat arus uang masuk dan keluar tanpa menelusuri daftar panjang.</p>
          </div>
          {lastUpdated ? <p className="flex shrink-0 items-center gap-2 text-xs font-bold text-ink-faint"><span className="size-2 rounded-full bg-brand" aria-hidden="true" />Diperbarui {formatDate(lastUpdated)}</p> : null}
        </div>
      </header>

      {categories.length ? (
        <>
          <div className="border-b border-line bg-surface-subtle/55 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Cari kategori pembukuan</span>
                <MagnifyingGlass size={18} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand" aria-hidden="true" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} type="search" placeholder="Cari kategori, misalnya iuran atau CCTV" className="min-h-11 w-full rounded-xl border border-line bg-surface-raised px-4 pl-10 pr-10 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15" />
                {query ? <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-faint transition hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Hapus pencarian kategori"><X size={16} weight="bold" aria-hidden="true" /></button> : null}
              </label>
              <div className="flex shrink-0 gap-1 rounded-xl border border-line bg-surface-raised p-1" role="group" aria-label="Saring arah uang">
                {directionOptions.map((option) => <button key={option.value} type="button" onClick={() => { setDirection(option.value); setShowAll(false); }} aria-pressed={direction === option.value} className={`min-h-9 rounded-lg px-3 text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${direction === option.value ? "bg-action text-on-action" : "text-ink-muted hover:bg-surface-subtle hover:text-ink"}`}>{option.label}</button>)}
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-ink-faint" aria-live="polite">{filtered.length} kategori ditemukan{isNarrowed ? " dari semua pembukuan" : ""}</p>
          </div>

          <div className="px-5 sm:px-7">
            <div className="hidden grid-cols-[minmax(0,1fr)_8.5rem_8.5rem] gap-4 border-b border-line py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-ink-faint sm:grid"><span>Kategori</span><span className="text-right">Masuk</span><span className="text-right">Keluar</span></div>
            {visible.length ? <div className="divide-y divide-line">{visible.map((item) => <article key={item.category} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem] sm:items-center sm:gap-4"><div className="min-w-0"><h3 className="truncate font-extrabold text-ink">{item.category}</h3><div className="mt-2 h-1 w-full max-w-[18rem] overflow-hidden rounded-full bg-surface-subtle" aria-hidden="true"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round((item.income / Math.max(item.income + item.expense, 1)) * 100))}%` }} /></div></div><p className="flex items-center justify-between gap-3 text-sm text-ink-muted sm:block sm:text-right"><span className="inline-flex items-center gap-1.5 font-bold text-brand-deep sm:hidden"><ArrowDownLeft size={15} weight="bold" aria-hidden="true" />Masuk</span><strong className="font-extrabold text-ink">{formatRupiah(item.income)}</strong></p><p className="flex items-center justify-between gap-3 text-sm text-ink-muted sm:block sm:text-right"><span className="inline-flex items-center gap-1.5 font-bold text-danger-deep sm:hidden"><ArrowUpRight size={15} weight="bold" aria-hidden="true" />Keluar</span><strong className="font-extrabold text-ink">{formatRupiah(item.expense)}</strong></p></article>)}</div> : <p className="border-b border-line py-10 text-center text-sm leading-6 text-ink-muted">Tidak ada kategori yang cocok. Coba kata lain atau pilih “Semua”.</p>}
            {hiddenCount > 0 ? <button type="button" onClick={() => setShowAll(true)} className="my-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-line text-sm font-extrabold text-brand-deep transition hover:border-brand hover:bg-brand-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Tampilkan {hiddenCount} kategori lainnya</button> : showAll && !isNarrowed && filtered.length > PREVIEW_LIMIT ? <button type="button" onClick={() => setShowAll(false)} className="my-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-line text-sm font-extrabold text-brand-deep transition hover:border-brand hover:bg-brand-soft/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Ringkas daftar</button> : null}
          </div>
        </>
      ) : <p className="px-5 py-8 text-sm leading-6 text-ink-muted sm:px-7">Pembukuan publik belum diterbitkan. RT akan menampilkan ringkasan setelah data Kas lama selesai direkonsiliasi.</p>}
    </section>
  );
}
