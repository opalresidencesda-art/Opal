"use client";

import { CaretRight, CheckCircle, List, User, X } from "@phosphor-icons/react";
import { createBrowserClient } from "@supabase/ssr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

const navigation = [
  { href: "/", label: "Beranda" },
  { href: "/panduan-harmonis", label: "Panduan harmonis" },
  { href: "/kas", label: "Kas OPAL" },
];

const subscribeToTheme = (onChange: () => void) => {
  window.addEventListener("opal-theme-change", onChange);
  return () => window.removeEventListener("opal-theme-change", onChange);
};

const getDarkThemeSnapshot = () => document.documentElement.getAttribute("data-theme") === "dark";
const getDarkThemeServerSnapshot = () => false;

const subscribeToHomeHeroSurface = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);

  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
};

const getHomeHeroPastSnapshot = () => {
  const hero = document.querySelector<HTMLElement>(".home-hero");

  return Boolean(hero && window.scrollY >= hero.offsetTop + hero.offsetHeight - 76);
};

const getHomeHeroPastServerSnapshot = () => false;

function useAdminSession() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabaseUrl || !supabasePublishableKey) return;

    const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
    let active = true;
    const syncAdmin = async (session: { user?: { email?: string | null } } | null) => {
      const email = session?.user?.email?.toLowerCase();
      if (!email) {
        if (active) setIsSignedIn(false);
        return;
      }
      const { data: admin } = await supabase.from("admin_users").select("email").eq("email", email).maybeSingle();
      if (active) setIsSignedIn(Boolean(admin));
    };
    void supabase.auth.getSession().then(({ data: { session } }) => syncAdmin(session)).catch(() => {
      if (active) setIsSignedIn(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (active) setIsSignedIn(false);
        return;
      }
      void syncAdmin(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return isSignedIn;
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isAdminSignedIn = useAdminSession();
  const onHome = pathname === "/";
  const darkMode = useSyncExternalStore(subscribeToTheme, getDarkThemeSnapshot, getDarkThemeServerSnapshot);
  const homeHeroPast = useSyncExternalStore(
    subscribeToHomeHeroSurface,
    getHomeHeroPastSnapshot,
    getHomeHeroPastServerSnapshot,
  );
  const headerDark = darkMode || (onHome && !homeHeroPast);
  const homePastHeroSurface = onHome && homeHeroPast
    ? darkMode
      ? "border-b border-white/10 bg-action/95"
      : "border-b border-line bg-surface/95 backdrop-blur-sm"
    : "";

  return (
    <header className={`top-0 z-30 w-full ${onHome ? "fixed" : "sticky"} ${headerDark ? "text-ink-inverse" : ""} ${homePastHeroSurface}`}>
      <div className="mx-auto grid h-[76px] max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <div className="lg:hidden">
          <BrandMark compact inverse={headerDark} />
        </div>
        <Link
          href="/"
          aria-label="OPAL Residence, ke beranda"
          className={`relative hidden h-14 w-28 shrink-0 overflow-hidden lg:block ${headerDark ? "focus-visible:ring-brand-highlight focus-visible:ring-offset-action" : "focus-visible:ring-brand focus-visible:ring-offset-surface"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4`}
        >
          <Image
            src="/images/Opal-residence.png"
            alt=""
            width={3783}
            height={1668}
            priority
            sizes="196px"
            quality={90}
            unoptimized
            className="absolute left-1/2 top-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.75]"
          />
        </Link>

        <nav
          className={`hidden items-center gap-0.5 rounded-full border p-1 lg:flex ${headerDark ? "border-white/20 bg-black/10" : "border-line bg-surface-raised/90 shadow-[0_1px_0_rgba(2,20,16,0.06)]"}`}
          aria-label="Navigasi utama"
        >
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-[0.76rem] font-bold tracking-[-0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-center after:bg-brand after:transition-transform ${headerDark ? `focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action ${active ? "text-ink-inverse after:scale-x-100" : "text-ink-inverse/68 after:scale-x-0 hover:text-ink-inverse"}` : `focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface ${active ? "text-brand-deep after:scale-x-100" : "text-ink-muted after:scale-x-0 hover:text-ink"}`}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-self-end gap-2 lg:flex">
          <Link
            href="/admin"
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-[0.76rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${headerDark ? "border-white/20 bg-black/10 text-ink-inverse hover:border-white/40 hover:bg-white/8 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action" : "border-line bg-surface-raised/72 text-ink hover:border-brand/60 hover:text-brand focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"}`}
          >
            <User size={14} weight="bold" aria-hidden="true" />
            {isAdminSignedIn ? <><CheckCircle size={15} weight="fill" aria-hidden="true" /> Admin aktif</> : "Admin RT"}
          </Link>
          <ThemeToggle inverse={headerDark} />
        </div>

        <div className="flex items-center justify-self-end gap-2 lg:hidden">
          <ThemeToggle inverse={headerDark} />
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsOpen((open) => !open)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-[0.94rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${headerDark ? "border-white/20 bg-white/10 text-ink-inverse hover:bg-white/16 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action" : "border-line bg-surface-raised text-ink hover:border-brand/60 hover:text-brand focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"}`}
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
            className={`overflow-hidden border-t lg:hidden ${headerDark ? "border-white/12 bg-action/96" : "border-line bg-surface"}`}
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
                    className={`flex min-h-14 items-center justify-between border-b px-1 text-[1.06rem] font-bold tracking-[-0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${headerDark ? `border-white/12 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action ${active ? "text-brand-highlight" : "text-ink-inverse/78 hover:text-ink-inverse"}` : `border-line focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${active ? "text-brand" : "text-ink hover:text-brand"}`}`}
                  >
                    {item.label}
                    <CaretRight size={18} weight="bold" aria-hidden="true" />
                  </Link>
                );
              })}
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`mt-4 inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-center text-[1rem] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 ${headerDark ? "bg-ink-inverse text-action hover:bg-brand-highlight focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action" : "bg-action text-on-action hover:bg-brand hover:text-on-brand focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"}`}
              >
                {isAdminSignedIn ? "Buka ruang kerja RT" : "Masuk ke admin RT"}
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
