"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { GuideSection } from "@/lib/content";

export function GuideSectionNav({ sections }: { sections: GuideSection[] }) {
  const jumpTo = (slug: string) => {
    document.getElementById(slug)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <label className="relative block lg:hidden">
        <span className="sr-only">Pilih bagian panduan</span>
        <select
          defaultValue=""
          onChange={(event) => jumpTo(event.target.value)}
          className="w-full appearance-none border-y border-line bg-surface-raised px-4 py-4 pr-11 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="" disabled>Pilih bagian panduan</option>
          {sections.map((section) => <option key={section.slug} value={section.slug}>{section.title}</option>)}
        </select>
        <CaretDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand" size={18} weight="bold" aria-hidden="true" />
      </label>
      <nav className="sticky top-[98px] hidden border-y border-line lg:block" aria-label="Daftar isi panduan">
        <p className="border-b border-line py-4 text-xs font-bold tracking-[0.13em] text-ink-muted">ISI PANDUAN</p>
        <ul className="divide-y divide-line">
          {sections.map((section) => (
            <li key={section.slug}>
              <button
                type="button"
                onClick={() => jumpTo(section.slug)}
                className="group flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-ink-muted hover:text-brand focus:outline-none"
              >
                {section.title}
                <span className="size-1.5 shrink-0 rounded-full bg-line transition-colors group-hover:bg-brand" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
