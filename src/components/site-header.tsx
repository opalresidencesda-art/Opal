"use client";

import { CaretRight, List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { href: "/", label: "Beranda" },
  { href: "/panduan-harmonis", label: "Panduan harmonis" },
  { href: "/kas", label: "Kas OPAL" },
  { href: "/layanan", label: "Layanan warga" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <BrandMark compact />

        <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Navigasi utama">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-10 items-center whitespace-nowrap rounded-xl px-3.5 text-[0.94rem] font-bold tracking-[-0.025em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface ${active ? "bg-brand-soft text-brand-deep" : "text-ink-muted hover:bg-surface-raised hover:text-ink"}`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="ml-3 inline-flex min-h-10 items-center rounded-xl bg-action px-4 text-[0.94rem] font-bold text-on-action transition-colors hover:-translate-y-0.5 hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
          >
            Admin RT
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-raised px-3.5 text-[0.94rem] font-bold text-ink transition-colors hover:border-brand/60 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
          >
            <span>{isOpen ? "Tutup" : "Menu"}</span>
            {isOpen ? <X size={20} weight="bold" aria-hidden="true" /> : <List size={21} weight="bold" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.nav
            id="mobile-menu"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-surface lg:hidden"
            aria-label="Navigasi mobile"
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
          >
            <div className="mx-auto grid max-w-[1440px] gap-1 px-5 py-5 sm:px-8">
              {navigation.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-14 items-center justify-between border-b border-line px-1 text-[1.06rem] font-bold tracking-[-0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${active ? "text-brand" : "text-ink hover:text-brand"}`}
                  >
                    {item.label}
                    <CaretRight size={18} weight="bold" aria-hidden="true" />
                  </Link>
                );
              })}
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-action px-5 text-center text-[1rem] font-bold text-on-action transition-colors hover:bg-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
              >
                Masuk ke admin RT
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
