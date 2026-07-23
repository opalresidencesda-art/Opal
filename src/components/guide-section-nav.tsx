"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { GuideSection } from "@/lib/content";

export function GuideSectionNav({ sections }: { sections: GuideSection[] }) {
  const jumpTo = (slug: string) => {
    window.location.hash = slug;
  };

  return (
    <>
      <label className="relative block lg:hidden">
        <span className="sr-only">Pilih bagian panduan</span>
        <select
          defaultValue=""
          onChange={(event) => jumpTo(event.target.value)}
          className="min-h-14 w-full appearance-none border-y border-line bg-surface-raised px-5 py-4 pr-12 text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="" disabled>Pilih bagian panduan</option>
          {sections.map((section) => <option key={section.slug} value={section.slug}>{section.title}</option>)}
        </select>
        <CaretDown className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-brand" size={20} weight="bold" aria-hidden="true" />
      </label>
      <nav className="sticky top-[92px] hidden border-y border-line lg:block" aria-label="Daftar isi panduan">
        <p className="border-b border-line py-4 text-sm font-bold tracking-[0.1em] text-ink-muted">ISI PANDUAN</p>
        <ul className="divide-y divide-line">
          {sections.map((section) => (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                className="group flex min-h-14 w-full items-center justify-between gap-3 py-4 text-left text-base font-semibold text-ink-muted hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
              >
                {section.title}
                <span className="w-3 shrink-0 border-t border-line transition-colors group-hover:border-brand" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
