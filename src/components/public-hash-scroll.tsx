"use client";

import { useEffect } from "react";

export function PublicHashScroll() {
  useEffect(() => {
    let retryTimer: number | undefined;
    let focusTimer: number | undefined;

    const clearPending = () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      if (focusTimer) window.clearTimeout(focusTimer);
    };

    const scrollToHash = () => {
      clearPending();
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;

      const scrollToTarget = (remainingAttempts: number) => {
        const target = document.getElementById(id);
        if (!target) {
          if (remainingAttempts > 0) retryTimer = window.setTimeout(() => scrollToTarget(remainingAttempts - 1), 80);
          return;
        }
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        focusTimer = window.setTimeout(() => {
          const heading = target.querySelector<HTMLElement>("h1, h2");
          heading?.focus({ preventScroll: true });
          if (document.activeElement !== heading) target.focus({ preventScroll: true });
        }, reducedMotion ? 0 : 280);
      };

      window.requestAnimationFrame(() => scrollToTarget(18));
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      clearPending();
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
