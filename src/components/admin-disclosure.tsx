"use client";

import { CaretDown, GearSix, HouseLine, Receipt, Stamp, UsersThree, Wrench } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

type AdminSectionIcon = "gear" | "wrench" | "stamp" | "users" | "house" | "cash";

export function AdminDisclosure({
  id,
  icon,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  id: string;
  icon: AdminSectionIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = icon === "gear" ? GearSix : icon === "stamp" ? Stamp : icon === "users" ? UsersThree : icon === "house" ? HouseLine : icon === "cash" ? Receipt : Wrench;

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== `#${id}` || !disclosureRef.current) return;
      setIsOpen(true);
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [id]);

  return (
    <section id={id} className="scroll-mt-28">
      <details ref={disclosureRef} className="group border-t border-line pt-8" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center border-l-2 border-brand bg-brand-soft text-brand-deep"><Icon size={21} weight="fill" aria-hidden="true" /></span>
            <div><h2 className="text-xl font-extrabold tracking-[-0.05em] text-ink sm:text-2xl">{title}</h2><p className="mt-1.5 max-w-3xl text-sm leading-6 text-ink-muted">{description}</p></div>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface-raised text-ink-muted transition group-open:rotate-180 group-open:border-brand group-open:text-brand" aria-hidden="true">
            <CaretDown size={19} weight="bold" />
          </span>
        </summary>
        <div className="mt-6">{children}</div>
      </details>
    </section>
  );
}

export type { AdminSectionIcon };
