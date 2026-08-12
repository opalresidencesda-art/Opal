"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { GuideSection } from "@/lib/content";

type GuideReadingShellProps = {
  sections: GuideSection[];
  children: ReactNode;
};

function sectionNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function GuideReadingShell({ sections, children }: GuideReadingShellProps) {
  const [activeSlug, setActiveSlug] = useState(sections[0]?.slug ?? "");
  const [mobileLabelSlug, setMobileLabelSlug] = useState("");
  const activeSlugRef = useRef(activeSlug);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activateSection = useCallback((slug: string) => {
    if (activeSlugRef.current === slug) return;

    activeSlugRef.current = slug;
    setActiveSlug(slug);
    setMobileLabelSlug(slug);
    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => setMobileLabelSlug(""), 1_000);
  }, []);

  useEffect(() => {
    if (!sections.length) return;

    const updateActiveSection = () => {
      const marker = window.innerHeight * 0.42;
      let nextSection = sections[0];

      for (const section of sections) {
        const element = document.getElementById(section.slug);
        if (element && element.getBoundingClientRect().top <= marker) nextSection = section;
      }

      activateSection(nextSection.slug);
    };

    let frame: number | undefined;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = undefined;
        updateActiveSection();
      });
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
    };
  }, [activateSection, sections]);

  useEffect(() => () => {
    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
  }, []);

  if (!sections.length) return <>{children}</>;

  return (
    <>
      <header className="mx-auto max-w-[1440px] px-5 pb-9 pt-10 sm:px-8 sm:pb-12 sm:pt-14 lg:px-10 lg:pb-14 lg:pt-16">
        <p className="public-kicker text-brand-deep">Panduan warga OPAL</p>
        <h1 className="public-display mt-4 max-w-3xl text-[2.35rem] font-bold leading-[0.98] text-ink sm:text-5xl lg:text-[3.5rem]">Panduan Harmonis</h1>
      </header>

      <nav className="fixed right-0 top-1/2 z-20 -translate-y-1/2 lg:hidden" aria-label="Navigasi bagian panduan">
        {mobileLabelSlug ? (
          <span data-guide-topic-cue="true" className="guide-topic-cue pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap border-l-4 border-brand bg-surface-raised px-3 py-2 text-sm font-extrabold text-ink shadow-[0_8px_24px_rgba(4,39,32,0.14)]" aria-hidden="true">
            {sections.find((section) => section.slug === mobileLabelSlug)?.title}
          </span>
        ) : null}
        <ol>
          {sections.map((section, index) => {
            const active = section.slug === activeSlug;
            return (
              <li key={section.id ?? section.slug}>
                <a
                  href={`#${section.slug}`}
                  aria-label={`${sectionNumber(index)} ${section.title}`}
                  aria-current={active ? "location" : undefined}
                  onClick={() => activateSection(section.slug)}
                  className="group flex size-11 items-center justify-end pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
                >
                  <span className={`h-0.5 transition-all ${active ? "w-7 bg-brand" : "w-2.5 bg-ink-faint/45 group-hover:w-4 group-hover:bg-brand"}`} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-16 sm:px-8 sm:pb-20 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pb-24">
        <nav data-guide-desktop-toc="true" className="sticky top-28 hidden self-start border-l-2 border-line py-1 pl-3 lg:block" aria-label="Daftar isi panduan">
          <p className="px-4 pb-3 pt-2 text-[0.76rem] font-extrabold uppercase tracking-[0.12em] text-ink-faint">Daftar isi</p>
          <ol className="grid gap-1">
            {sections.map((section, index) => {
              const active = section.slug === activeSlug;
              return (
                <li key={section.id ?? section.slug}>
                  <a
                    href={`#${section.slug}`}
                    aria-current={active ? "location" : undefined}
                    onClick={() => activateSection(section.slug)}
                    className={`relative grid min-h-12 grid-cols-[1.65rem_minmax(0,1fr)] items-center gap-2 px-4 py-3 text-[0.9rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${active ? "bg-brand-soft/70 text-ink before:absolute before:-left-[14px] before:inset-y-0 before:w-1 before:bg-brand" : "text-ink-muted hover:bg-brand-soft/25 hover:text-ink"}`}
                  >
                    <span className={`text-[0.62rem] tracking-[0.1em] ${active ? "text-brand" : "text-ink-faint"}`} aria-hidden="true">{sectionNumber(index)}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
