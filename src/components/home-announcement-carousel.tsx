"use client";

import { Bell, CaretLeft, CaretRight, Pause, Play } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { getNextAnnouncementIndex, type Announcement } from "@/lib/content";
import { formatDate } from "@/lib/format";

const AUTO_ADVANCE_MS = 5_000;
const emptyAnnouncement: Announcement = {
  title: "Belum ada pengumuman baru.",
  body: "Informasi terbaru dari pengurus RT akan tampil di sini.",
  publishedAt: "",
  pinned: false,
};

export function HomeAnnouncementCarousel({ announcements, id = "pengumuman" }: { announcements: Announcement[]; id?: string }) {
  const items = announcements.length ? announcements : [emptyAnnouncement];
  const count = items.length;
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeIndex = activeIndex % count;
  const announcement = items[safeIndex];
  const autoPlaying = count > 1 && !paused && !reduceMotion;

  useEffect(() => {
    if (!autoPlaying) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => getNextAnnouncementIndex(current, count));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [activeIndex, autoPlaying, count]);

  const move = (step: number) => {
    setActiveIndex((current) => getNextAnnouncementIndex(current, count, step));
    setPaused(true);
  };

  return (
    <article
      id={id}
      tabIndex={-1}
      className="flex h-full min-h-[18rem] flex-col bg-[#111e1d] px-5 py-5 text-[#dce7e4] sm:min-h-[19rem] sm:px-7 sm:py-7"
      aria-label="Pengumuman warga"
      aria-roledescription="carousel"
    >
      <div className="flex items-center justify-between gap-4 text-[#dce7e4]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0e6b63] text-[#dce7e4]" aria-hidden="true">
            <Bell size={21} weight="fill" />
          </span>
          <p className="text-[0.78rem] font-extrabold">Pengumuman warga</p>
        </div>
        {count > 1 ? (
          <p className="shrink-0 text-[0.7rem] font-extrabold tabular-nums text-[#dce7e4]/65">
            {safeIndex + 1} dari {count}
          </p>
        ) : null}
      </div>

      <div className="relative mt-7 flex-1 overflow-hidden">
        {announcements.length ? (
          <time dateTime={announcement.publishedAt} className="text-[0.67rem] font-bold text-[#dce7e4]/62">
            Diperbarui {formatDate(announcement.publishedAt)}
          </time>
        ) : null}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={announcement.id ?? `${announcement.publishedAt}-${announcement.title}`}
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            aria-live={autoPlaying ? "off" : "polite"}
            aria-atomic="true"
          >
            <h2 className="mt-3 max-w-3xl text-[1.28rem] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#dce7e4] sm:text-[1.55rem]">
              {announcement.title}
            </h2>
            <p className="mt-3 max-w-3xl text-[0.82rem] leading-6 text-[#dce7e4]/76">
              {announcement.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 ? (
        <div className="mt-5 flex gap-1.5" role="group" aria-label="Kontrol pengumuman">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Pengumuman sebelumnya"
            className="grid size-11 place-items-center rounded-xl border border-[#1b2d2b] bg-[#0b1514] text-[#dce7e4] transition-colors hover:border-[#0e6b63] hover:bg-[#0e6b63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dce7e4]"
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
          {!reduceMotion ? (
            <button
              type="button"
              onClick={() => setPaused((current) => !current)}
              aria-label={paused ? "Putar pengumuman otomatis" : "Jeda pengumuman otomatis"}
              className="grid size-11 place-items-center rounded-xl border border-[#1b2d2b] bg-[#0b1514] text-[#dce7e4] transition-colors hover:border-[#0e6b63] hover:bg-[#0e6b63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dce7e4]"
            >
              {paused ? <Play size={17} weight="fill" aria-hidden="true" /> : <Pause size={17} weight="fill" aria-hidden="true" />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Pengumuman berikutnya"
            className="grid size-11 place-items-center rounded-xl border border-[#1b2d2b] bg-[#0b1514] text-[#dce7e4] transition-colors hover:border-[#0e6b63] hover:bg-[#0e6b63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dce7e4]"
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </article>
  );
}
