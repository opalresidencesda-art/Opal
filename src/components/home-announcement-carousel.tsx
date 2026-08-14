import { ArrowUpRight, CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { announcementImageUrl, type Announcement } from "@/lib/content";
import { formatDate } from "@/lib/format";

function announcementExcerpt(announcement: Announcement) {
  if (announcement.title === "81 TAHUN KEMERDEKAAN RI") {
    return "Rangkaian kegiatan 17 Agustus warga OPAL, mulai dari Game 17-an hingga Jalan Sehat dan Malam Syukuran.";
  }

  const text = announcement.body.replace(/\s+/g, " ").trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 180).replace(/\s+[^\s]*$/, "")}…`;
}

function announcementMeta(announcement: Announcement) {
  if (announcement.title === "81 TAHUN KEMERDEKAAN RI") {
    return { category: "Kegiatan warga", dates: "8–16 Agustus 2026", location: "Taman Bermain Delima" };
  }

  return { category: "Informasi warga", dates: formatDate(announcement.publishedAt), location: "OPAL Residence" };
}

export function AnnouncementPreview({ announcement, featured = false }: { announcement: Announcement; featured?: boolean }) {
  const imageUrl = announcementImageUrl(announcement);
  const meta = announcementMeta(announcement);
  const detailHref = announcement.id ? `/pengumuman/${announcement.id}` : "#pengumuman";

  return (
    <article className={`group overflow-hidden border border-line bg-surface-raised ${featured ? "grid md:grid-cols-[minmax(0,1fr)_minmax(17rem,0.72fr)]" : "flex flex-col"}`}>
      {featured && imageUrl ? (
        <figure className="relative order-2 min-h-64 overflow-hidden border-t border-line bg-surface-subtle md:order-2 md:min-h-full md:border-l md:border-t-0">
          <Image src={imageUrl} alt={announcement.imageAlt || announcement.title} fill sizes="(min-width: 768px) 35vw, 100vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.025]" />
        </figure>
      ) : null}
      <div className={`min-w-0 p-6 sm:p-8 ${featured ? "md:p-10" : "flex h-full flex-col"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-deep">
          <span>{meta.category}</span>
          <span className="text-ink-faint" aria-hidden="true">·</span>
          <time dateTime={announcement.publishedAt}>{formatDate(announcement.publishedAt)}</time>
        </div>
        <h3 className={`mt-5 max-w-2xl font-extrabold leading-[1.03] tracking-[-0.055em] text-ink ${featured ? "text-[2rem] sm:text-[2.7rem]" : "text-xl sm:text-2xl"}`}>
          {announcement.title}
        </h3>
        <p className="mt-4 max-w-2xl text-[0.9rem] leading-7 text-ink-muted">{announcementExcerpt(announcement)}</p>
        <dl className="mt-7 grid gap-3 border-t border-line pt-5 text-[0.78rem] sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <CalendarBlank className="mt-0.5 shrink-0 text-brand" size={17} weight="fill" aria-hidden="true" />
            <div><dt className="sr-only">Tanggal kegiatan</dt><dd className="font-bold text-ink">{meta.dates}</dd></div>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 shrink-0 text-brand" size={17} weight="fill" aria-hidden="true" />
            <div><dt className="sr-only">Lokasi</dt><dd className="font-bold text-ink">{meta.location}</dd></div>
          </div>
        </dl>
        <Link href={detailHref} className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 border-b-2 border-brand pb-1 text-sm font-extrabold text-brand-deep transition-colors hover:border-brand-deep hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          Baca pengumuman <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function HomeAnnouncementCarousel({ announcements, id = "pengumuman" }: { announcements: Announcement[]; id?: string }) {
  const visibleAnnouncements = announcements.slice(0, 3);

  return (
    <section id={id} aria-label="Pengumuman warga" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-5">
        <div>
          <p className="public-kicker text-brand-deep">Informasi terbaru</p>
          <h2 className="public-display mt-3 text-[2rem] font-bold leading-[0.98] tracking-[-0.05em] text-ink sm:text-[2.65rem]">Pengumuman warga</h2>
        </div>
        {announcements.length > 3 ? <Link href="/pengumuman" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-brand-deep hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Lihat semua <ArrowUpRight size={18} weight="bold" aria-hidden="true" /></Link> : null}
      </div>

      {visibleAnnouncements.length ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <AnnouncementPreview announcement={visibleAnnouncements[0]} featured />
          {visibleAnnouncements.length > 1 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">{visibleAnnouncements.slice(1).map((announcement) => <AnnouncementPreview key={announcement.id ?? announcement.title} announcement={announcement} />)}</div> : null}
        </div>
      ) : (
        <div className="mt-8 border border-dashed border-line bg-surface-raised px-6 py-8 text-sm leading-7 text-ink-muted">Belum ada pengumuman baru dari pengurus RT.</div>
      )}
    </section>
  );
}
