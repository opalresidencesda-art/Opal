"use client";

import { useEffect } from "react";

export function GuideHashScroll() {
  useEffect(() => {
    const scrollToGuideHash = () => {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;

      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      });
    };

    scrollToGuideHash();
    window.addEventListener("hashchange", scrollToGuideHash);
    return () => window.removeEventListener("hashchange", scrollToGuideHash);
  }, []);

  return null;
}
