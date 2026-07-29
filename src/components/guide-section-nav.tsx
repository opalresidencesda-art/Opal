"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { GuideSection } from "@/lib/content";

export function GuideSectionNav({ sections }: { sections: GuideSection[] }) {
  const jumpTo = (slug: string) => {
    window.location.hash = slug;
  };

  if (!sections.length) return null;

  return (
    <>
      <label className="relative block lg:hidden">
        <span className="sr-only">Pilih bagian panduan</span>
        <select
          defaultValue=""
          onChange={(event) => jumpTo(event.target.value)}
          className="min-h-14 w-full appearance-none rounded-xl border border-line bg-surface-raised px-5 py-4 pr-12 text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="" disabled>Pilih bagian panduan</option>
          {sections.map((section) => <option key={section.slug} value={section.slug}>{section.title}</option>)}
        </select>
        <CaretDown className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-brand" size={20} weight="bold" aria-hidden="true" />
      </label>
      <nav className="sticky top-[92px] hidden self-start rounded-[1.15rem] border border-line bg-surface-raised p-2 lg:block" aria-label="Daftar isi panduan">
        <p className="px-4 pb-3 pt-2 text-sm font-bold tracking-[-0.02em] text-ink">Daftar panduan</p>
        <ul className="grid gap-1">
          {sections.map((section) => (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold text-ink-muted hover:bg-surface-subtle hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
              >
                {section.title}
                <span className="text-base font-bold transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
