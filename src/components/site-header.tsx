"use client";

import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandMark compact />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-semibold ${active ? "text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                {item.label}
                {active ? <span className="absolute inset-x-3 -bottom-[2px] h-0.5 bg-brand" aria-hidden="true" /> : null}
              </Link>
            );
          })}
          <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />
          <ThemeToggle />
          <Link
            href="/admin"
            className="ml-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:bg-brand focus-visible:outline-none"
          >
            Admin RT
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised text-ink transition hover:-translate-y-0.5 hover:border-brand/60 hover:text-brand focus-visible:outline-none"
          >
            <span className="sr-only">{isOpen ? "Tutup menu" : "Buka menu"}</span>
            {isOpen ? <X size={20} weight="bold" /> : <List size={21} weight="bold" />}
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
          >
            <div className="mx-auto grid max-w-[1440px] gap-1 px-5 py-4 sm:px-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`border-b border-line px-1 py-4 text-[1rem] font-semibold ${pathname === item.href ? "text-brand" : "text-ink"}`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="mt-3 rounded-full bg-ink px-5 py-3.5 text-center text-sm font-bold text-ink-inverse"
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
