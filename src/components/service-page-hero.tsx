import Image from "next/image";
import type { ReactNode } from "react";

export function ServicePageHero({ kicker, title, description, children }: { kicker: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="hero-image-drift relative isolate overflow-hidden bg-action text-ink-inverse">
      <Image
        src="/images/opal-neighborhood-hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_center] opacity-75"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,24,20,0.97)_0%,rgba(3,24,20,0.84)_48%,rgba(3,24,20,0.24)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,24,20,0.12),rgba(3,24,20,0.7))]" aria-hidden="true" />
      <div className={`relative mx-auto grid min-h-[440px] max-w-[1440px] items-end gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 ${children ? "lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.48fr)]" : ""}`}>
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold tracking-[0.16em] text-brand-highlight">{kicker}</p>
          <h1 className="public-display mt-5 text-4xl font-bold leading-[0.96] sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink-inverse/78 sm:text-lg">{description}</p>
        </div>
        {children ? <div className="rounded-2xl border border-white/16 bg-action/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:p-6">{children}</div> : null}
      </div>
    </section>
  );
}
