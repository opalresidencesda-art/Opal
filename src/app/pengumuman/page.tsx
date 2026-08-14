import Link from "next/link";
import { AnnouncementPreview } from "@/components/home-announcement-carousel";
import { getPortalData } from "@/lib/data";

export const metadata = {
  title: "Pengumuman Warga",
  description: "Pengumuman dan kegiatan terbaru warga OPAL Residence.",
};

export default async function AnnouncementsPage() {
  const { announcements } = await getPortalData();

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-extrabold text-brand-deep hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">← Kembali ke beranda</Link>
      <header className="mt-12 max-w-3xl border-b border-line pb-8">
        <p className="public-kicker text-brand-deep">Arsip warga</p>
        <h1 className="public-display mt-4 text-4xl font-bold leading-[0.98] tracking-[-0.06em] text-ink sm:text-6xl">Pengumuman warga</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Kegiatan, informasi lingkungan, dan kabar terbaru dari pengurus RT OPAL.</p>
      </header>
      {announcements.length ? <div className="mt-10 grid gap-5 lg:grid-cols-2">{announcements.map((announcement) => <AnnouncementPreview key={announcement.id ?? announcement.title} announcement={announcement} featured={false} />)}</div> : <p className="mt-10 border border-dashed border-line px-6 py-8 text-sm leading-7 text-ink-muted">Belum ada pengumuman baru.</p>}
    </main>
  );
}
