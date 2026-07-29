"use client";

import { MoonStars, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";

export function ThemeToggle({ inverse = false }: { inverse?: boolean }) {
  const { setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Ganti tema warna"
      title="Ganti tema warna"
      onClick={() => {
        const nextTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        document.documentElement.style.colorScheme = nextTheme;
        window.localStorage.setItem("theme", nextTheme);
        window.dispatchEvent(new Event("opal-theme-change"));
      }}
      className={`grid size-10 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 ${
        inverse
          ? "border-white/18 bg-white/8 text-ink-inverse hover:bg-white/16 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action"
          : "border-line bg-surface-raised text-ink hover:border-brand hover:text-brand focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      }`}
    >
      <MoonStars className="theme-icon-moon" size={19} weight="fill" aria-hidden="true" />
      <Sun className="theme-icon-sun" size={19} weight="fill" aria-hidden="true" />
    </button>
  );
}
