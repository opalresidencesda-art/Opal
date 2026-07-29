import Image from "next/image";
import type { GuideSection } from "@/lib/content";

type TopicStyle = {
  image?: { src: string; alt: string; position?: string };
  layout: string;
  tone: "dark" | "light" | "soft";
  featured?: boolean;
};

const topicStyles: Record<string, TopicStyle> = {
  iuran: {
    layout: "lg:col-span-5",
    tone: "dark",
  },
  parkir: {
    image: {
      src: "/images/opal-neighborhood-hero.png",
      alt: "Jalan lingkungan OPAL Residence pada siang hari",
      position: "object-[58%_center]",
    },
    layout: "lg:col-span-7 lg:row-span-2",
    tone: "light",
    featured: true,
  },
  "stiker-kendaraan": {
    layout: "lg:col-span-5",
    tone: "soft",
  },
  renovasi: {
    image: {
      src: "/images/guide/renovasi-rumah.jpg",
      alt: "Ilustrasi rumah yang sedang direnovasi",
      position: "object-center",
    },
    layout: "lg:col-span-5",
    tone: "light",
  },
  "sampah-rumah-tangga": {
    image: {
      src: "/images/guide/taman-lingkungan.jpg",
      alt: "Ilustrasi jalur taman yang terawat dan bersih",
      position: "object-center",
    },
    layout: "lg:col-span-7",
    tone: "light",
  },
};

function TopicLink({ section }: { section: GuideSection }) {
  const style = topicStyles[section.slug] ?? { layout: "lg:col-span-6", tone: "soft" as const };
  const toneClass = style.tone === "dark"
    ? "border-action bg-action text-ink-inverse"
    : style.tone === "soft"
      ? "border-line bg-surface-subtle text-ink"
      : "border-line bg-surface-raised text-ink";
  const summaryClass = style.tone === "dark" ? "text-ink-inverse/72" : "text-ink-muted";

  return (
    <a
      href={`#${section.slug}`}
      className={`group min-h-14 overflow-hidden rounded-[1.15rem] border transition hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_20px_50px_rgba(5,48,40,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface ${style.layout} ${style.featured ? "grid sm:grid-cols-[1.08fr_0.92fr]" : "flex flex-col"} ${toneClass}`}
    >
      {style.image ? (
        <div className={`relative min-h-44 overflow-hidden bg-surface-subtle ${style.featured ? "sm:min-h-full" : ""}`}>
          <Image
            src={style.image.src}
            alt={style.image.alt}
            fill
            sizes={style.featured ? "(max-width: 1024px) 100vw, 52vw" : "(max-width: 1024px) 100vw, 34vw"}
            className={`object-cover transition duration-500 group-hover:scale-[1.035] ${style.image.position ?? "object-center"}`}
          />
        </div>
      ) : null}
      <div className={`flex min-h-36 flex-1 flex-col justify-between p-5 sm:p-6 ${style.featured ? "sm:min-h-full" : ""}`}>
        <div>
          <h3 className="text-[1.12rem] font-extrabold tracking-[-0.045em]">{section.title}</h3>
          <p className={`mt-2 max-w-md text-[0.86rem] leading-6 ${summaryClass}`}>{section.summary}</p>
        </div>
        <span className={`mt-7 inline-flex w-fit border-b pb-1 text-[0.74rem] font-extrabold ${style.tone === "dark" ? "border-brand-highlight text-brand-highlight" : "border-brand text-brand-deep"}`}>Buka panduan</span>
      </div>
    </a>
  );
}

export function GuideTopicIndex({ sections }: { sections: GuideSection[] }) {
  return (
    <section aria-labelledby="guide-topic-index-title" className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="max-w-2xl">
        <h2 id="guide-topic-index-title" className="public-display text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Pilih kebutuhan Anda, lalu baca yang penting.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">Setiap topik dibagi agar aturan rumah dan lingkungan lebih mudah ditemukan saat diperlukan.</p>
      </div>

      <div data-guide-topic-index="true" className="mt-8 grid gap-3 lg:grid-cols-12 lg:gap-4">
        {sections.map((section) => <TopicLink key={section.id ?? section.slug} section={section} />)}
      </div>
    </section>
  );
}
