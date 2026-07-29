"use client";

import {
  ArrowRight,
  BookOpenText,
  FileText,
  HouseLine,
  Receipt,
  ShieldCheck,
  UsersThree,
  Wallet,
  Wrench,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { quickAccessCategories, type QuickAccessCategory, type QuickAccessIcon } from "@/lib/quick-access";

const iconMap = {
  book: BookOpenText,
  file: FileText,
  house: HouseLine,
  receipt: Receipt,
  shield: ShieldCheck,
  users: UsersThree,
  wallet: Wallet,
  wrench: Wrench,
} satisfies Record<QuickAccessIcon, typeof FileText>;

export function HomeQuickAccess() {
  const [activeId, setActiveId] = useState<QuickAccessCategory["id"]>("surat");
  const activeCategory = quickAccessCategories.find((category) => category.id === activeId) ?? quickAccessCategories[0];

  return (
    <div className="mt-12 lg:mt-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(13rem,0.28fr)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:pt-1">
          <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-ink-faint">Pilih kategori</p>
          <div className="mt-4 grid grid-cols-2 gap-x-6 lg:block" aria-label="Kategori akses cepat">
            {quickAccessCategories.map((category, index) => {
              const Icon = iconMap[category.icon];
              const active = category.id === activeCategory.id;

              return (
                <button
                  key={category.id}
                  id={`quick-access-${category.id}`}
                  type="button"
                  onClick={() => setActiveId(category.id)}
                  aria-pressed={active}
                  aria-controls="quick-access-panel"
                  className={`group flex min-h-16 w-full items-center gap-3 border-b border-line py-3 text-left text-[0.8rem] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface sm:text-[0.9rem] ${
                    active ? "text-brand-deep" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <span className={`h-7 w-1 shrink-0 transition-colors ${active ? "bg-brand" : "bg-transparent group-hover:bg-line"}`} aria-hidden="true" />
                  <span className={`text-[0.6rem] font-bold tracking-[0.14em] ${active ? "text-brand" : "text-ink-faint"}`} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden="true" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="quick-access-panel"
          className="min-w-0 lg:border-l lg:border-line lg:pl-16"
          aria-live="polite"
          aria-labelledby={`quick-access-${activeCategory.id}`}
        >
          <div className="max-w-2xl">
            <p className="public-kicker text-brand-deep">{activeCategory.label}</p>
            <p className="mt-4 text-[0.9rem] leading-7 text-ink-muted sm:text-base sm:leading-7">{activeCategory.description}</p>
          </div>

          <div className="mt-9 space-y-1 sm:mt-10">
            {activeCategory.items.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group grid min-h-[6.5rem] grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:gap-5 sm:py-6"
                >
                  <Icon className="mt-0.5 text-brand transition-transform duration-200 group-hover:-translate-y-0.5" size={25} weight="fill" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-base font-extrabold leading-6 tracking-[-0.04em] text-ink transition-colors group-hover:text-brand-deep sm:text-[1.2rem]">
                      {item.title}
                    </span>
                    <span className="mt-2 block max-w-2xl text-[0.8rem] leading-6 text-ink-muted sm:text-[0.9rem] sm:leading-6">
                      {item.description}
                    </span>
                    {item.note ? (
                      <span className="mt-2 block text-[0.8rem] font-bold leading-6 text-brand-deep">{item.note}</span>
                    ) : null}
                  </span>
                  <ArrowRight className="mt-1 shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand" size={23} weight="bold" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
