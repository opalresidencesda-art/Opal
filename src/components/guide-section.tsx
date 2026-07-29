import Image from "next/image";
import type { FeeSchedule, GuideSection } from "@/lib/content";
import { FeeList } from "@/components/fee-list";
import { MarkdownContent } from "@/components/markdown-content";

type GuideImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  position?: string;
};

function GuideImage({ src, alt, className = "", sizes, position = "object-center" }: GuideImageProps) {
  return (
    <figure className={`relative overflow-hidden rounded-[1.15rem] bg-surface-subtle ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} className={`object-cover ${position}`} />
    </figure>
  );
}

function ArticleHeading({ section }: { section: GuideSection }) {
  return (
    <header>
      <h2 tabIndex={-1} className="hash-scroll-heading public-display text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">{section.title}</h2>
      <p className="mt-4 max-w-xl text-[1.02rem] leading-8 text-ink-muted">{section.summary}</p>
    </header>
  );
}

function ArticleMarkdown({ section }: { section: GuideSection }) {
  return (
    <details className="group mt-10 max-w-3xl overflow-hidden rounded-[1.15rem] border border-line bg-surface-raised">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-[0.88rem] font-extrabold text-ink marker:content-none sm:px-6">
        Baca aturan lengkap
        <span className="text-[0.74rem] font-bold text-brand group-open:hidden" aria-hidden="true">Buka</span>
        <span className="hidden text-[0.74rem] font-bold text-brand group-open:inline" aria-hidden="true">Tutup</span>
      </summary>
      <div className="guide-prose border-t border-line px-5 pb-7 pt-1 sm:px-6 sm:pb-8"><MarkdownContent>{section.bodyMarkdown}</MarkdownContent></div>
    </details>
  );
}

function ParkingHighlights() {
  const entries = [
    ["01", "Mobil pertama", "Masuk carport rumah."],
    ["02", "Mobil kedua", "Parkir di depan rumah sendiri dan mepet pembatas jalan."],
    ["03", "Mobil ketiga atau tamu", "Gunakan rumah kosong atau pojok gang yang tidak mengganggu."],
  ];

  return (
    <dl className="mt-9 grid gap-5 sm:grid-cols-3">
      {entries.map(([number, title, description]) => (
        <div key={number} className="border-l-2 border-brand pl-4">
          <dt className="text-[0.68rem] font-extrabold tracking-[0.12em] text-brand">{number}</dt>
          <dd className="mt-3 text-[0.92rem] font-extrabold tracking-[-0.035em] text-ink">{title}</dd>
          <p className="mt-1 text-[0.78rem] leading-6 text-ink-muted">{description}</p>
        </div>
      ))}
    </dl>
  );
}

function StickerArchive() {
  return (
    <aside className="grid gap-5 rounded-[1.15rem] border border-line bg-surface-subtle p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:p-6">
      <div>
        <p className="text-[0.98rem] font-extrabold tracking-[-0.035em] text-ink">Arsip QR panduan lama</p>
        <p className="mt-2 max-w-md text-[0.8rem] leading-6 text-ink-muted">Kode disimpan sebagai arsip karena tautan tutorial asalnya belum dapat diverifikasi oleh pengurus.</p>
      </div>
      <figure className="flex items-center gap-3">
        <Image src="/images/guide/qr-stiker-mobil.png" alt="QR tutorial stiker mobil dari panduan lama" width={96} height={96} className="shrink-0 border border-line bg-surface-raised p-1" />
        <figcaption className="text-[0.75rem] font-extrabold text-ink">Mobil</figcaption>
      </figure>
      <figure className="flex items-center gap-3">
        <Image src="/images/guide/qr-stiker-motor.png" alt="QR tutorial stiker motor dari panduan lama" width={96} height={96} className="shrink-0 border border-line bg-surface-raised p-1" />
        <figcaption className="text-[0.75rem] font-extrabold text-ink">Motor</figcaption>
      </figure>
    </aside>
  );
}

function IuranChapter({ section, fees }: { section: GuideSection; fees: FeeSchedule[] }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 py-14 first:pt-0 sm:py-20 sm:first:pt-0">
      <div className="grid gap-8 border-b border-line pb-9 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
        <ArticleHeading section={section} />
        <p className="border-l-2 border-brand pl-4 text-[0.86rem] leading-6 text-ink-muted">Setiap nominal tampil bersama tanggal mulai berlakunya, sehingga warga tidak perlu menebak informasi yang masih aktif.</p>
      </div>
      <div className="mt-8 rounded-[1.15rem] border border-line bg-surface-raised"><FeeList fees={fees} variant="home" /></div>
      <ArticleMarkdown section={section} />
    </article>
  );
}

function ParkingChapter({ section }: { section: GuideSection }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)] lg:items-center lg:gap-12">
        <GuideImage src="/images/guide/driveway-tropis.jpg" alt="Ilustrasi akses kendaraan pada rumah tropis" sizes="(max-width: 1024px) 100vw, 58vw" className="aspect-[4/3]" position="object-center" />
        <div>
          <ArticleHeading section={section} />
          <ParkingHighlights />
        </div>
      </div>
      <ArticleMarkdown section={section} />
    </article>
  );
}

function StickerChapter({ section }: { section: GuideSection }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(24rem,1.18fr)] lg:items-end lg:gap-12">
        <ArticleHeading section={section} />
        <StickerArchive />
      </div>
      <ArticleMarkdown section={section} />
    </article>
  );
}

function RenovationChapter({ section }: { section: GuideSection }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] lg:items-center lg:gap-12">
        <div>
          <ArticleHeading section={section} />
          <div className="mt-9 border-l-2 border-brand pl-5">
            <p className="text-[0.7rem] font-extrabold tracking-[0.13em] text-brand">JAM KERJA NORMAL</p>
            <p className="public-display mt-2 text-4xl font-bold leading-none text-ink sm:text-5xl">07.00-17.00</p>
            <p className="mt-3 text-[0.86rem] leading-6 text-ink-muted">Pekerjaan tanpa suara bising seperti pengecatan menjadi pengecualian.</p>
          </div>
        </div>
        <GuideImage src="/images/guide/renovasi-rumah.jpg" alt="Ilustrasi rumah yang sedang direnovasi" sizes="(max-width: 1024px) 100vw, 35vw" className="aspect-[4/5] max-h-[36rem]" position="object-center" />
      </div>
      <ArticleMarkdown section={section} />
    </article>
  );
}

function WasteChapter({ section }: { section: GuideSection }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-14 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
        <GuideImage src="/images/guide/taman-lingkungan.jpg" alt="Ilustrasi jalur taman yang terawat dan bersih" sizes="(max-width: 1024px) 100vw, 35vw" className="aspect-[4/5] max-h-[36rem]" position="object-center" />
        <div>
          <p className="public-display text-5xl font-bold leading-none text-brand-deep sm:text-6xl">240 L</p>
          <div className="mt-7"><ArticleHeading section={section} /></div>
        </div>
      </div>
      <ArticleMarkdown section={section} />
    </article>
  );
}

function DefaultChapter({ section }: { section: GuideSection }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-14 sm:py-20">
      <ArticleHeading section={section} />
      <ArticleMarkdown section={section} />
    </article>
  );
}

export function GuideSectionArticle({ section, fees }: { section: GuideSection; fees: FeeSchedule[] }) {
  if (section.slug === "iuran") return <IuranChapter section={section} fees={fees} />;
  if (section.slug === "parkir") return <ParkingChapter section={section} />;
  if (section.slug === "stiker-kendaraan") return <StickerChapter section={section} />;
  if (section.slug === "renovasi") return <RenovationChapter section={section} />;
  if (section.slug === "sampah-rumah-tangga") return <WasteChapter section={section} />;
  return <DefaultChapter section={section} />;
}
