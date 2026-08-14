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

export function QuickAccessPanel({ categoryId, headingId = "quick-access-title" }: { categoryId: QuickAccessCategory["id"]; headingId?: string }) {
  const activeCategory = quickAccessCategories.find((category) => category.id === categoryId) ?? quickAccessCategories[0];

  return (
    <div className="border border-line bg-surface-raised px-4 py-4 sm:px-6 sm:py-5" aria-labelledby={headingId}>
      <div className="max-w-2xl">
        <h3 id={headingId} tabIndex={-1} data-quick-access-heading="true" className="text-base font-extrabold tracking-[-0.035em] text-ink focus-visible:outline-none sm:text-lg">{activeCategory.label}</h3>
        <p className="mt-1.5 text-[0.8rem] leading-6 text-ink-muted sm:text-sm">{activeCategory.description}</p>
      </div>

      <div className="mt-4 divide-y divide-line border-t border-line">
        {activeCategory.items.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group grid min-h-[4.5rem] grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset sm:grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:gap-4"
            >
              <Icon className="mt-0.5 text-brand" size={22} weight="fill" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-extrabold leading-5 tracking-[-0.025em] text-ink transition-colors group-hover:text-brand-deep sm:text-base">{item.title}</span>
                <span className="mt-1 block max-w-3xl text-[0.76rem] leading-5 text-ink-muted sm:text-[0.82rem]">{item.description}</span>
                {item.note ? <span className="mt-1 block text-[0.75rem] font-bold leading-5 text-brand-deep">{item.note}</span> : null}
              </span>
              <ArrowRight className="mt-0.5 shrink-0 text-ink-faint transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand" size={20} weight="bold" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
