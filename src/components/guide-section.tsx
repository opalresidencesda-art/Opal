import Image from "next/image";
import { FeeList } from "@/components/fee-list";
import { MarkdownContent } from "@/components/markdown-content";
import type { FeeSchedule, GuideSection } from "@/lib/content";

const guideImages: Record<string, { src: string; alt: string }> = {
  parkir: {
    src: "/images/guide/parkir-diagram.png",
    alt: "Diagram panduan OPAL yang menunjukkan mobil pertama di carport dan mobil kedua mepet pembatas tepi jalan",
  },
  "stiker-kendaraan": {
    src: "/images/guide/stiker-pemasangan.png",
    alt: "Contoh asli bentuk dan posisi pemasangan stiker kendaraan OPAL pada kaca depan mobil",
  },
  renovasi: {
    src: "/images/guide/renovasi-panduan.png",
    alt: "Ilustrasi asli panduan renovasi OPAL tentang izin tetangga, pekerjaan bangunan, keamanan, dan jam kerja",
  },
  "sampah-rumah-tangga": {
    src: "/images/guide/sampah-240-liter.png",
    alt: "Contoh asli tempat sampah rumah OPAL dan tempat sampah pengganti berkapasitas 240 liter",
  },
};

const stickerVideos = [
  { id: "qtyrlcLybZg", title: "Tutorial pemasangan stiker mobil OPAL", label: "Stiker mobil" },
  { id: "9blRp958AXs", title: "Tutorial pemasangan stiker motor OPAL", label: "Stiker motor" },
];

function StickerTutorials() {
  return (
    <section className="mt-12 border-t border-line pt-9" aria-labelledby="guide-sticker-tutorial-title">
      <h3 id="guide-sticker-tutorial-title" className="text-[1.35rem] font-extrabold tracking-[-0.04em] text-ink">Video cara pemasangan</h3>
      <p className="mt-2 max-w-2xl text-[0.92rem] leading-7 text-ink-muted">Pilih tutorial sesuai kendaraan. Video resmi OPAL dapat diputar langsung di halaman ini.</p>
      <div className="mt-6 grid gap-7 xl:grid-cols-2">
        {stickerVideos.map((video) => (
          <figure key={video.id}>
            <div className="aspect-video overflow-hidden bg-action">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                title={video.title}
                className="size-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <figcaption className="mt-3 text-[0.86rem] font-extrabold text-ink">{video.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function GuideSectionArticle({
  section,
  fees,
  index,
}: {
  section: GuideSection;
  fees: FeeSchedule[];
  index: number;
}) {
  const image = guideImages[section.slug];
  const sectionNumber = String(index + 1).padStart(2, "0");

  return (
    <article
      id={section.slug}
      data-guide-section="true"
      tabIndex={-1}
      className="scroll-mt-28 border-t border-line py-14 first:border-t-0 first:pt-0 sm:py-20 sm:first:pt-0"
    >
      <div className={`grid gap-6 ${image ? "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-stretch lg:gap-8" : "max-w-3xl"}`}>
        <header className="border-l-4 border-brand bg-brand-soft/55 px-5 py-6 sm:px-7 sm:py-8">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-deep">Bab {sectionNumber}</p>
          <h2 tabIndex={-1} className="hash-scroll-heading public-display mt-3 text-[2.15rem] font-bold leading-[0.98] text-ink sm:text-[2.75rem]">{section.title}</h2>
          <p className="mt-5 max-w-2xl text-[1.02rem] leading-8 text-ink-muted sm:text-[1.08rem]">{section.summary}</p>
        </header>
        {image ? (
          <figure className="relative aspect-[4/3] overflow-hidden bg-surface-subtle lg:aspect-auto lg:min-h-[20rem]">
            <Image src={image.src} alt={image.alt} fill sizes="(max-width: 1024px) 100vw, 38vw" className="object-contain" />
          </figure>
        ) : null}
      </div>

      {section.slug === "iuran" ? (
        <section className="mt-10" aria-label="Nominal iuran aktif">
          <FeeList fees={fees} variant="guide" />
        </section>
      ) : null}

      {section.slug !== "iuran" ? (
        <div className="guide-prose mt-10 max-w-3xl"><MarkdownContent nested>{section.bodyMarkdown}</MarkdownContent></div>
      ) : null}

      {section.slug === "stiker-kendaraan" ? <StickerTutorials /> : null}
    </article>
  );
}
