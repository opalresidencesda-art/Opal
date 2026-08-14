import { ArrowLeft, CalendarBlank, MapPin } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { announcementImageUrl } from "@/lib/content";
import { getPublishedAnnouncement } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcement = await getPublishedAnnouncement(id);
  if (!announcement) notFound();
  const imageUrl = announcementImageUrl(announcement);
  const isEvent = announcement.title === "81 TAHUN KEMERDEKAAN RI";

  return (
    <main className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <Link href="/pengumuman" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-brand-deep hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Semua pengumuman</Link>
      <article className="mt-12 overflow-hidden border border-line bg-surface-raised">
        {imageUrl ? <figure className="relative aspect-[16/8] min-h-56 overflow-hidden border-b border-line bg-surface-subtle sm:min-h-72"><Image src={imageUrl} alt={announcement.imageAlt || announcement.title} fill sizes="(min-width: 1120px) 1080px, 100vw" unoptimized priority className="object-cover" /></figure> : null}
        <div className="max-w-3xl px-6 py-8 sm:px-10 sm:py-12">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-brand-deep">{isEvent ? "Kegiatan warga" : "Informasi warga"}</p>
          <h1 className="public-display mt-5 text-4xl font-bold leading-[0.98] tracking-[-0.06em] text-ink sm:text-6xl">{announcement.title}</h1>
          <div className="mt-7 grid gap-3 border-y border-line py-5 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2.5"><CalendarBlank className="text-brand" size={18} weight="fill" aria-hidden="true" /><time dateTime={announcement.publishedAt} className="font-bold text-ink">Diperbarui {formatDate(announcement.publishedAt)}</time></div>
            {isEvent ? <div className="flex items-center gap-2.5"><MapPin className="text-brand" size={18} weight="fill" aria-hidden="true" /><span className="font-bold text-ink">Taman Bermain Delima</span></div> : null}
          </div>
          <p className="mt-8 whitespace-pre-line text-base leading-8 text-ink-muted">{announcement.body}</p>
        </div>
      </article>
    </main>
  );
}
