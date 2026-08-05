"use client";

import { CheckCircle, List, User, X } from "@phosphor-icons/react";
import { createBrowserClient } from "@supabase/ssr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
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
  const mobileHeaderDark = headerDark || isOpen;
  const homePastHeroSurface = onHome && homeHeroPast
    ? darkMode
      ? "border-b border-white/10 bg-action/95"
      : "border-b border-line bg-surface/95 backdrop-blur-sm"
    : "";

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktopQuery.matches) setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    desktopQuery.addEventListener("change", closeOnDesktop);
    closeOnDesktop();

    return () => {
      desktopQuery.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className={`top-0 z-30 w-full ${onHome ? "fixed" : "sticky"} ${headerDark ? "text-ink-inverse" : ""} ${homePastHeroSurface}`}>
      <div className={`relative z-50 mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-8 lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:px-10 ${isOpen ? "bg-action text-ink-inverse" : ""}`}>
        <div className="lg:hidden">
          <Link
            href="/"
            aria-label="OPAL Residence, ke beranda"
            className={`relative block h-7 w-[6rem] shrink-0 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${mobileHeaderDark ? "focus-visible:ring-brand-highlight focus-visible:ring-offset-action" : "focus-visible:ring-brand focus-visible:ring-offset-surface"}`}
          >
            <Image
              src="/images/Opal-residence.png"
              alt=""
              width={3783}
              height={1668}
              priority
              sizes="96px"
              quality={90}
              unoptimized
              className={`absolute left-1/2 top-1/2 h-auto w-full max-w-none -translate-x-1/2 -translate-y-1/2 ${mobileHeaderDark ? "brightness-0 invert" : ""}`}
            />
          </Link>
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

        <div className="flex items-center justify-self-end gap-1.5 lg:hidden">
          <span className="grid size-11 place-items-center [&>button]:size-11">
            <ThemeToggle inverse={mobileHeaderDark} />
          </span>
          {!isOpen ? (
            <button
              type="button"
              aria-expanded={false}
              aria-controls="mobile-menu"
              aria-label="Buka menu navigasi"
              title="Buka menu navigasi"
              onClick={() => setIsOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsOpen(false);
              }}
              className={`grid size-11 place-items-center rounded-none text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 ${mobileHeaderDark ? "text-ink-inverse hover:text-brand-highlight focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action" : "text-ink hover:text-brand focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"}`}
            >
              <List size={21} weight="bold" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <>
            <motion.div
              aria-hidden="true"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-40 bg-action/60 lg:hidden"
            />
            <motion.nav
              id="mobile-menu"
              initial={reduceMotion ? false : { opacity: 0, scaleY: 0.94 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scaleY: 0.94 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "top left", borderBottomRightRadius: "78dvh" }}
              className="fixed inset-x-0 top-0 z-40 h-[min(78dvh,35rem)] overflow-hidden bg-action text-ink-inverse lg:hidden"
              aria-label="Navigasi mobile"
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsOpen(false);
              }}
            >
              <div className="mx-auto grid h-full max-w-[1440px] content-start overflow-y-auto px-8 pb-24 pt-[5.5rem] sm:px-10">
                <div className="grid">
                  {navigation.map((item) => {
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        className={`flex min-h-[3.75rem] items-center px-0 text-[clamp(1.12rem,4.8vw,1.4rem)] font-bold tracking-[-0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action ${active ? "text-brand-highlight" : "text-ink-inverse hover:text-brand-highlight"}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="mt-5 flex min-h-[3.75rem] items-center gap-3 px-0 text-left text-ink-inverse transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action hover:text-brand-highlight"
                  >
                    {isAdminSignedIn ? <CheckCircle size={21} weight="fill" className="shrink-0 text-brand-highlight" aria-hidden="true" /> : <User size={21} weight="bold" className="shrink-0 text-brand-highlight" aria-hidden="true" />}
                    <span>
                      <span className="block text-[1rem] font-bold">{isAdminSignedIn ? "Admin aktif" : "Admin RT"}</span>
                      <span className="mt-0.5 block text-[0.72rem] font-semibold text-ink-inverse/62">
                        {isAdminSignedIn ? "Buka ruang kerja RT" : "Masuk untuk pengurus"}
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            </motion.nav>
            <button
              type="button"
              aria-expanded={true}
              aria-controls="mobile-menu"
              aria-label="Tutup menu navigasi"
              title="Tutup menu navigasi"
              onClick={() => setIsOpen(false)}
              className="fixed left-1/2 z-50 grid size-14 -translate-x-1/2 place-items-center rounded-full border border-white/20 bg-brand text-on-brand shadow-[0_8px_24px_rgba(2,20,16,0.22)] transition-colors hover:bg-brand-highlight hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-action"
              style={{ top: "calc(min(78dvh, 35rem) - 28px)" }}
            >
              <X size={22} weight="bold" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
