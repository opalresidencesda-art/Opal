import type { ReactNode } from "react";

export function ServicePageHero({ kicker, title, description, children }: { kicker: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="bg-action text-ink-inverse">
      <div className="mx-auto max-w-[1040px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <p className="text-xs font-extrabold tracking-[0.16em] text-brand-soft">{kicker}</p>
        <h1 className="public-display mt-5 max-w-3xl text-4xl font-bold leading-[0.96] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-inverse/78 sm:text-lg">{description}</p>
        {children ? <div className="mt-9 border-t border-white/15 pt-6">{children}</div> : null}
      </div>
    </section>
  );
}
