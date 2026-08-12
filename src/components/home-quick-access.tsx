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
import { useEffect, useState } from "react";
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

type HomeQuickAccessProps = {
  initialActiveId?: QuickAccessCategory["id"];
};

export function HomeQuickAccess({ initialActiveId = "surat" }: HomeQuickAccessProps) {
  const [activeId, setActiveId] = useState(initialActiveId);
  const activeCategory = quickAccessCategories.find((category) => category.id === activeId) ?? quickAccessCategories[0];

  useEffect(() => {
    function selectCategory(event: Event) {
      const categoryId = (event as CustomEvent<QuickAccessCategory["id"]>).detail;

      if (quickAccessCategories.some((category) => category.id === categoryId)) {
        setActiveId(categoryId);
      }
    }

    window.addEventListener("opal-quick-access-select", selectCategory);
    return () => window.removeEventListener("opal-quick-access-select", selectCategory);
  }, []);

  return (
    <div className="mt-12 lg:mt-16">
      <div id="quick-access-panel" className="max-w-4xl" aria-labelledby="quick-access-title">
        <div className="max-w-2xl">
          <h3 id="quick-access-title" className="public-kicker text-brand-deep">{activeCategory.label}</h3>
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
  );
}
