"use client";

import { useEffect } from "react";

export function GuideHashScroll() {
  useEffect(() => {
    let retryTimer: number | undefined;
    let focusTimer: number | undefined;

    const clearPending = () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      if (focusTimer) window.clearTimeout(focusTimer);
    };

    const scrollToGuideHash = () => {
      clearPending();
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;

      const scrollToArticle = (remainingAttempts: number) => {
        const article = document.getElementById(id);
        if (!article) {
          if (remainingAttempts > 0) retryTimer = window.setTimeout(() => scrollToArticle(remainingAttempts - 1), 80);
          return;
        }
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        article.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        focusTimer = window.setTimeout(() => {
          const heading = article.querySelector<HTMLElement>("h2");
          heading?.focus({ preventScroll: true });
          if (document.activeElement !== heading) article.focus({ preventScroll: true });
        }, reducedMotion ? 0 : 280);
      };

      window.requestAnimationFrame(() => scrollToArticle(18));
    };

    scrollToGuideHash();
    window.addEventListener("hashchange", scrollToGuideHash);
    return () => {
      clearPending();
      window.removeEventListener("hashchange", scrollToGuideHash);
    };
  }, []);

  return null;
}
