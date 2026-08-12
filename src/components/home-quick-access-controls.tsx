"use client";

import {
  ArrowRight,
  BookOpenText,
  FileText,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  quickAccessCategories,
  type QuickAccessCategory,
} from "@/lib/quick-access";

const quickAccessIcons = {
  surat: FileText,
  panduan: BookOpenText,
  data: UsersThree,
  keuangan: Wallet,
} satisfies Record<QuickAccessCategory["id"], typeof FileText>;

type HomeQuickAccessControlsProps = {
  initialActiveId?: QuickAccessCategory["id"];
};

function scrollToQuickAccess(categoryId: QuickAccessCategory["id"]) {
  const target = document.getElementById("akses-cepat");
  const url = new URL(window.location.href);
  url.searchParams.set("akses", categoryId);
  url.hash = "akses-cepat";
  window.history.replaceState(null, "", url);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });

  window.setTimeout(
    () => document.getElementById("home-services-title")?.focus({ preventScroll: true }),
    reducedMotion ? 0 : 280,
  );
}

export function HomeQuickAccessControls({
  initialActiveId = "surat",
}: HomeQuickAccessControlsProps) {
  const [activeId, setActiveId] = useState(initialActiveId);

  function selectCategory(categoryId: QuickAccessCategory["id"]) {
    setActiveId(categoryId);
    window.dispatchEvent(
      new CustomEvent<QuickAccessCategory["id"]>("opal-quick-access-select", {
        detail: categoryId,
      }),
    );
    scrollToQuickAccess(categoryId);
  }

  return (
    <aside
      className="border-t border-line bg-surface-raised px-5 py-3 text-ink sm:px-7 sm:py-4 lg:border-t-0 lg:border-l"
      aria-label="Pintasan layanan warga"
    >
      <nav className="divide-y divide-line" aria-label="Pilih layanan warga">
        {quickAccessCategories.map((category, index) => {
          const Icon = quickAccessIcons[category.id];
          const active = category.id === activeId;

          return (
            <a
              key={category.id}
              href="#akses-cepat"
              aria-current={active ? "true" : undefined}
              className={`group grid min-h-[4.25rem] grid-cols-[1.85rem_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${
                active ? "text-brand-deep" : "text-ink"
              }`}
              onClick={(event) => {
                event.preventDefault();
                selectCategory(category.id);
              }}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                  active
                    ? "border-brand bg-brand text-on-brand"
                    : "border-line text-brand group-hover:border-brand group-hover:bg-brand-soft"
                }`}
                aria-hidden="true"
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
              </span>
              <span className="min-w-0">
                <span
                  className="block text-[0.66rem] font-extrabold tracking-[0.13em] text-ink-faint"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 block text-[0.82rem] font-extrabold leading-5 sm:text-[0.9rem]">
                  {category.label}
                </span>
              </span>
              <ArrowRight
                className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand"
                size={19}
                weight="bold"
                aria-hidden="true"
              />
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
