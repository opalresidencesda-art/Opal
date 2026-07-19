"use client";

import { MoonStars, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Gunakan tema terang" : "Gunakan tema gelap";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-10 place-items-center rounded-full border border-line bg-surface-raised text-ink transition hover:-translate-y-0.5 hover:border-brand/60 hover:text-brand"
    >
      <span className="sr-only">{label}</span>
      {isDark ? <Sun size={18} weight="bold" aria-hidden="true" /> : <MoonStars size={18} weight="bold" aria-hidden="true" />}
    </button>
  );
}
