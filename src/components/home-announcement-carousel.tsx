"use client";

import { ArrowUpRight, CalendarBlank, MapPin, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const imageUrl = announcementImageUrl(announcement);
  const meta = announcementMeta(announcement);
  const dialogTitleId = `announcement-dialog-${announcement.id ?? "preview"}`;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function closeDialog() {
    setIsOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <>
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
        <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)} className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 border-b-2 border-brand pb-1 text-left text-sm font-extrabold text-brand-deep transition-colors hover:border-brand-deep hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
          Baca pengumuman <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
      </article>
      {isOpen ? (
      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-action/65 p-3 sm:items-center sm:p-6" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} className="flex max-h-[min(90dvh,52rem)] w-full max-w-3xl flex-col overflow-hidden border border-line bg-surface shadow-[0_24px_80px_rgba(3,23,19,0.3)]">
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-deep">{meta.category}</p>
              <h2 id={dialogTitleId} className="mt-1.5 text-xl font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-2xl">{announcement.title}</h2>
            </div>
            <button ref={closeRef} type="button" onClick={closeDialog} aria-label="Tutup pengumuman" className="grid size-11 shrink-0 place-items-center border border-line text-ink-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><X size={20} weight="bold" aria-hidden="true" /></button>
          </header>
          <div className="min-h-0 overflow-y-auto">
            {imageUrl ? <figure className="relative aspect-[16/8] min-h-44 overflow-hidden border-b border-line bg-surface-subtle sm:min-h-64"><Image src={imageUrl} alt={announcement.imageAlt || announcement.title} fill sizes="(min-width: 768px) 768px, 100vw" unoptimized className="object-cover" /></figure> : null}
            <div className="px-5 py-6 sm:px-7 sm:py-8">
              <div className="grid gap-3 border-b border-line pb-5 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2.5"><CalendarBlank className="text-brand" size={18} weight="fill" aria-hidden="true" /><time dateTime={announcement.publishedAt} className="font-bold text-ink">Diperbarui {formatDate(announcement.publishedAt)}</time></div>
                <div className="flex items-center gap-2.5"><MapPin className="text-brand" size={18} weight="fill" aria-hidden="true" /><span className="font-bold text-ink">{meta.location}</span></div>
              </div>
              <p className="mt-6 whitespace-pre-line text-[0.95rem] leading-8 text-ink-muted sm:text-base">{announcement.body}</p>
            </div>
          </div>
        </section>
      </div>
      ) : null}
    </>
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
