"use client";

import { ArrowUpRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchHomeContent, type HomeSearchItem } from "@/lib/home-search";

type HomePortalSearchProps = {
  index: HomeSearchItem[];
};

export function HomePortalSearch({ index }: HomePortalSearchProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchHomeContent(index, query), [index, query]);
  const hasQuery = Boolean(query.trim());
  const activeResult = results[activeIndex];

  useEffect(() => {
    rootRef.current?.setAttribute("data-home-portal-search-ready", "true");
  }, []);

  const selectResult = (item: HomeSearchItem) => {
    setOpen(false);
    if (item.external) {
      window.location.assign(item.href);
      return;
    }
    router.push(item.href);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
    setOpen(Boolean(value.trim()));
  };

  return (
    <div ref={rootRef} className="relative mt-6 text-left sm:mt-7">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (activeResult) selectResult(activeResult);
        }}
      >
        <label htmlFor="home-portal-search" className="sr-only">Cari informasi warga</label>
        <div className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-white/65 bg-ink-inverse px-4 shadow-[0_18px_50px_rgba(2,20,16,0.28)] transition focus-within:border-brand-highlight focus-within:ring-4 focus-within:ring-brand-highlight/30 sm:min-h-[4.75rem] sm:px-5">
          <input
            id="home-portal-search"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            onFocus={() => setOpen(hasQuery)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && results.length) {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((current) => (current + 1) % results.length);
              }
              if (event.key === "ArrowUp" && results.length) {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((current) => (current - 1 + results.length) % results.length);
              }
              if (event.key === "Escape") {
                setOpen(false);
              }
              if (event.key === "Enter" && activeResult) {
                event.preventDefault();
                selectResult(activeResult);
              }
            }}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            aria-activedescendant={open && activeResult ? `${listId}-${activeResult.id}` : undefined}
            role="combobox"
            placeholder="Contoh: surat domisili, iuran, parkir"
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] font-semibold text-action outline-none placeholder:text-ink-muted sm:text-[1.05rem]"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => updateQuery("")}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-ink-muted transition hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Hapus pencarian"
            >
              <X size={20} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="submit"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-on-brand transition hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-ink-inverse sm:size-12"
            aria-label="Cari"
          >
            <MagnifyingGlass size={24} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </form>

      <p className="sr-only" aria-live="polite">
        {hasQuery ? `${results.length} hasil pencarian untuk ${query}.` : ""}
      </p>

      {open && hasQuery ? (
        <div id={listId} role="listbox" aria-label="Hasil pencarian" className="absolute z-20 mt-2 max-h-[min(25rem,calc(100dvh-8rem))] w-full overflow-y-auto rounded-2xl border border-line bg-surface-raised p-2 shadow-[0_24px_70px_rgba(2,20,16,0.25)]">
          {results.length ? results.map((item, index) => {
            const content = <>
              <span className="block text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-brand">{item.kind}</span>
              <span className="mt-1 block text-[0.95rem] font-extrabold leading-5 text-ink">{item.title}</span>
              <span className="mt-1 block line-clamp-2 text-[0.76rem] leading-5 text-ink-muted">{item.description}</span>
            </>;
            const className = `group relative block rounded-xl px-4 py-3.5 pr-12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${index === activeIndex ? "bg-brand-soft/70" : "hover:bg-surface-subtle"}`;
            const arrow = <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint transition-transform group-hover:-translate-y-[calc(50%+0.15rem)] group-hover:translate-x-0.5 group-hover:text-brand" size={20} weight="bold" aria-hidden="true" />;

            return item.external ? (
              <a
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={index === activeIndex}
                href={item.href}
                className={className}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setOpen(false)}
              >
                {content}{arrow}
              </a>
            ) : (
              <Link
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={index === activeIndex}
                href={item.href}
                className={className}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setOpen(false)}
              >
                {content}{arrow}
              </Link>
            );
          }) : (
            <p className="px-4 py-5 text-[0.85rem] leading-6 text-ink-muted">Belum ditemukan. Coba kata seperti “iuran”, “parkir”, atau “domisili”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
