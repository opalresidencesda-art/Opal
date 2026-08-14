"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const groups = [
  { label: "Kerja hari ini", links: [["antrean", "Antrean"], ["surat", "Penerbitan surat"], ["kas", "Kas OPAL"]] },
  { label: "Rumah & iuran", links: [["peta-rumah", "Peta Rumah"], ["rumah", "Akses rumah"], ["iuran-rumah", "Iuran per rumah"]] },
  { label: "Konten publik", links: [["pengumuman", "Pengumuman"], ["layanan", "Layanan"], ["panduan", "Panduan"], ["fasilitas", "Petugas & spesifikasi"]] },
  { label: "Pengaturan", links: [["iuran", "Iuran aktif"], ["arsip-surat", "Arsip surat"], ["pengurus", "Akses pengurus"]] },
] as const;

const sectionIds = groups.flatMap((group) => group.links.map(([id]) => id)).filter((id) => id !== "kas" && id !== "peta-rumah");

export function AdminNavigation() {
  const [activeId, setActiveId] = useState("antrean");

  useEffect(() => {
    const syncActiveSection = () => {
      const threshold = Math.min(window.innerHeight * 0.34, 280);
      let nextId = sectionIds[0] ?? "antrean";
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= threshold) nextId = id;
      }
      setActiveId((current) => current === nextId ? current : nextId);
    };
    const syncFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (sectionIds.includes(hash as (typeof sectionIds)[number])) setActiveId(hash);
      window.requestAnimationFrame(syncActiveSection);
    };

    syncFromHash();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    window.addEventListener("hashchange", syncFromHash);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  return (
    <nav aria-label="Bagian admin" className="admin-navigation -mx-5 flex gap-6 overflow-x-auto border-y border-line bg-surface px-5 py-3 sm:mx-0 sm:px-0 lg:sticky lg:top-24 lg:mx-0 lg:h-fit lg:flex-col lg:gap-5 lg:overflow-visible lg:border-0 lg:bg-action lg:px-3 lg:py-4 lg:text-on-action">
      <p className="sr-only lg:not-sr-only lg:px-2 lg:text-[0.65rem] lg:font-extrabold lg:uppercase lg:tracking-[0.14em] lg:text-on-action/55">Navigasi ruang kerja</p>
      {groups.map((group) => (
        <div key={group.label} className="shrink-0 lg:w-full">
          <p className="mb-1 px-1 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint lg:px-2 lg:text-on-action/45">{group.label}</p>
          <div className="flex gap-1 lg:flex-col">
            {group.links.map(([id, label]) => {
              const external = id === "peta-rumah" || id === "kas";
              const active = activeId === id;
              const href = id === "peta-rumah" ? "/admin/peta-rumah" : id === "kas" ? "/admin/kas" : `#${id}`;
              return <a key={id} href={href} aria-current={active ? "location" : undefined} onClick={() => setActiveId(id)} className={`group flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight lg:px-2.5 ${active ? "bg-brand text-on-brand shadow-[0_8px_20px_rgba(0,0,0,0.16)]" : "text-ink-muted hover:bg-surface-subtle hover:text-ink lg:text-on-action/72 lg:hover:bg-white/10 lg:hover:text-on-action"}`}><span className={`grid size-5 shrink-0 place-items-center transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} aria-hidden="true">{external ? <ArrowRight size={14} weight="bold" /> : <span className="size-1.5 rounded-full bg-current" />}</span><span className="whitespace-nowrap">{label}</span></a>;
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
