import type { GuideSection } from "@/lib/content";

export function GuideTopicIndex({ sections }: { sections: GuideSection[] }) {
  if (sections.length) return null;

  return (
    <section aria-labelledby="guide-topic-index-title" className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="max-w-2xl">
        <h1 id="guide-topic-index-title" className="public-display text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Panduan warga sedang disiapkan.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">Topik panduan akan muncul di sini setelah pengurus menerbitkannya dari portal admin.</p>
      </div>
    </section>
  );
}
