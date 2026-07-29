"use client";

import { SpinnerGap } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useTransition, type FormEvent, type MouseEvent, type ReactNode } from "react";

type FilterState = { q: string; direction: string; visibility: string; from: string; to: string };
type CashFilterContextValue = { isPending: boolean };

const cashFilterContext = createContext<CashFilterContextValue>({ isPending: false });

export function AdminCashFilterBoundary({ filters, children }: { filters: FilterState; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  const navigate = (href: string) => {
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const submit = (event: FormEvent<HTMLDivElement>) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.querySelector('input[name="q"]') === null) return;
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    params.delete("page");
    navigate(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const interceptNavigation = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest("a");
    const href = link?.getAttribute("href");
    if (!href?.startsWith("/admin/kas") || link?.target) return;
    event.preventDefault();
    navigate(href);
  };

  return <cashFilterContext.Provider value={{ isPending }}><div key={filterKey} onSubmit={submit} onClick={interceptNavigation} aria-busy={isPending}>{children}</div></cashFilterContext.Provider>;
}

export function AdminCashRowsLoadingLayer() {
  const { isPending } = useContext(cashFilterContext);
  if (!isPending) return null;
  return <div className="absolute inset-0 z-10 bg-surface/80 px-2 py-5 backdrop-blur-[1px]" role="status" aria-live="polite"><div className="flex items-center justify-center gap-2 text-sm font-extrabold text-brand-deep"><SpinnerGap size={18} weight="bold" className="animate-spin" aria-hidden="true" /> Memuat baris histori…</div><div className="mt-5 space-y-3" aria-hidden="true">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl border border-line bg-surface-subtle/80" />)}</div></div>;
}
