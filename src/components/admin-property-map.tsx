"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useGesture } from "@use-gesture/react";
import { ArrowCounterClockwise, CaretRight, CheckCircle, Copy, HouseLine, MagnifyingGlass, MapTrifold, Minus, Plus, Prohibit, Receipt, SpinnerGap, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, WheelEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPropertyMapLink, savePropertyProfile } from "@/app/admin/actions";
import { shouldZoomMapFromWheel } from "@/lib/opal-map-gesture";
import { OPAL_MAP_SLOTS, OPAL_MAP_VIEWBOX, mapStatus, type MapSlot, type PropertyMapStatus, type PropertyMapSummary, unplacedProperties } from "@/lib/opal-map-layout";

type MapFilter = "all" | PropertyMapStatus;
type Camera = { x: number; y: number; scale: number };
type InspectorTab = "summary" | "family" | "contributions" | "history";

const occupancyLabels: Record<string, string> = {
  self: "Dihuni sendiri", relative: "Dihuni kerabat", tenant: "Dihuni penyewa", vacant_rent: "Kosong, disewakan", vacant_sale: "Kosong, dijual",
};

const occupationLabels: Record<string, string> = { employee: "Pegawai", entrepreneur: "Wiraswasta", student: "Pelajar" };

const statusMeta: Record<PropertyMapStatus, { label: string; fill: string; stroke: string; panel: string }> = {
  verified: { label: "Data sah", fill: "#148778", stroke: "#07584e", panel: "bg-brand-soft text-brand-deep" },
  attention: { label: "Perlu tindak lanjut", fill: "#c9902d", stroke: "#80570d", panel: "bg-[#f5e7c4] text-[#6b4b0c]" },
  missing: { label: "Belum ada data", fill: "#8a9b95", stroke: "#5e716a", panel: "bg-surface-subtle text-ink-muted" },
  vacant: { label: "Unit kosong", fill: "#eff4f1", stroke: "#789187", panel: "bg-surface-raised text-ink-muted" },
};

const initialCamera: Camera = { x: 0, y: 0, scale: 1 };
const roadCenters = [220, 580, 940, 1_300];
const treeClusters = [[156, 154], [1_450, 172], [152, 748], [1_445, 730], [474, 782], [1_098, 786]] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatMonth(value: string | null) {
  if (!value) return "Belum tercatat";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function newest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
}

function newestContribution(items: PropertyMapSummary["contributions"]) {
  return [...items].sort((left, right) => String(right.period ?? "").localeCompare(String(left.period ?? "")))[0];
}

function dataStatus(property: PropertyMapSummary | undefined): PropertyMapStatus {
  return property ? mapStatus(property) : "missing";
}

export function AdminPropertyMap({ properties, initialUnit }: { properties: PropertyMapSummary[]; initialUnit?: string }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<Camera>(initialCamera);
  const pinchScale = useRef(1);
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(initialUnit ?? null);
  const propertyByUnit = useMemo(() => new Map(properties.map((property) => [property.unitCode, property])), [properties]);
  const unplaced = useMemo(() => unplacedProperties(properties), [properties]);
  const selectedSlot = selectedUnit ? OPAL_MAP_SLOTS.find((slot) => slot.unitCode === selectedUnit) ?? null : null;
  const selectedProperty = selectedUnit ? propertyByUnit.get(selectedUnit) : undefined;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (initialUnit) {
      const slot = OPAL_MAP_SLOTS.find((item) => item.unitCode === initialUnit);
      if (slot) focusSlot(slot, false);
    }
  // The deep link must focus only when the requested unit changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUnit]);

  const bind = useGesture({
    onDrag: ({ event, first, offset: [x, y], tap }) => {
      if (event instanceof PointerEvent && event.pointerType === "touch") return;
      if (first) dragOrigin.current = camera;
      if (tap) return;
      setCamera({ ...dragOrigin.current, x: dragOrigin.current.x + x, y: dragOrigin.current.y + y });
    },
    onPinch: ({ first, offset: [distance] }) => {
      if (first) pinchScale.current = camera.scale;
      setCamera((current) => ({ ...current, scale: clamp(pinchScale.current * (distance / 100), 0.82, 2.8) }));
    },
  }, {
    drag: { filterTaps: true, from: () => [0, 0] },
    wheel: { eventOptions: { passive: false } },
    pinch: { scaleBounds: { min: 0.82, max: 2.8 } },
  });

  function handleMapWheel(event: WheelEvent<HTMLDivElement>) {
    if (!shouldZoomMapFromWheel(event.nativeEvent)) return;
    event.preventDefault();
    setCamera((current) => ({ ...current, scale: clamp(current.scale - event.deltaY * 0.0014, 0.82, 2.8) }));
  }

  function focusSlot(slot: MapSlot, shouldOpen = true) {
    const viewport = viewportRef.current;
    const scale = 1.52;
    if (viewport) {
      const x = viewport.clientWidth / 2 - ((slot.x + slot.width / 2) / OPAL_MAP_VIEWBOX.width) * viewport.clientWidth * scale;
      const y = viewport.clientHeight / 2 - ((slot.y + slot.height / 2) / OPAL_MAP_VIEWBOX.height) * viewport.clientHeight * scale;
      setCamera({ x, y, scale });
    }
    setSelectedUnit(slot.unitCode);
    if (shouldOpen) router.replace(`/admin/peta-rumah?unit=${encodeURIComponent(slot.unitCode)}`, { scroll: false });
  }

  function openProperty(property: PropertyMapSummary) {
    const slot = OPAL_MAP_SLOTS.find((item) => item.unitCode === property.unitCode);
    if (slot) focusSlot(slot);
    else {
      setSelectedUnit(property.unitCode);
      router.replace(`/admin/peta-rumah?unit=${encodeURIComponent(property.unitCode)}`, { scroll: false });
    }
  }

  function clearSelection() {
    setSelectedUnit(null);
    router.replace("/admin/peta-rumah", { scroll: false });
  }

  function isActive(slot: MapSlot) {
    const property = propertyByUnit.get(slot.unitCode);
    const state = dataStatus(property);
    const matchesFilter = filter === "all" || state === filter;
    const matchesQuery = !normalizedQuery || slot.unitCode.toLowerCase().includes(normalizedQuery) || property?.profile?.responsibleName.toLowerCase().includes(normalizedQuery);
    return matchesFilter && Boolean(matchesQuery);
  }

  return <div className="min-h-[100dvh] bg-[#eff4f1] px-3 py-3 sm:px-5 sm:py-5">
    <div className="mx-auto grid max-w-[1680px] gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section className="overflow-hidden rounded-[22px] border border-[#c8d7d0] bg-[#f9fcfa] shadow-[0_22px_80px_rgba(7,43,35,0.12)]">
        <header className="flex flex-col gap-4 border-b border-[#d7e2dc] px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="min-w-0"><p className="text-[0.68rem] font-extrabold tracking-[0.16em] text-brand uppercase">OPAL Atlas</p><h1 className="mt-1 text-2xl font-black tracking-[-0.06em] text-ink sm:text-3xl">Peta operasional rumah</h1></div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-brand" />Data sah</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#c9902d]" />Tindak lanjut</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#8a9b95]" />Belum ada data</span></div>
        </header>
        <div className="grid gap-3 border-b border-[#d7e2dc] bg-[#f4f8f5] p-3 lg:grid-cols-[minmax(14rem,1fr)_auto_auto] lg:items-center lg:px-5">
          <label className="relative block"><MagnifyingGlass size={18} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Cari unit atau penanggung jawab" className="min-h-11 w-full rounded-xl border border-[#cddbd5] bg-white px-4 pl-10 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15" /></label>
          <div className="flex overflow-x-auto rounded-xl border border-[#cddbd5] bg-white p-1" aria-label="Filter status peta">{(["all", "attention", "verified", "missing", "vacant"] as MapFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-extrabold ${filter === item ? "bg-action text-on-action shadow-sm" : "text-ink-muted hover:text-brand-deep"}`}>{item === "all" ? "Semua" : statusMeta[item].label}</button>)}</div>
          <div className="flex items-center justify-between gap-1 rounded-xl border border-[#cddbd5] bg-white p-1"><button aria-label="Perkecil peta" type="button" onClick={() => setCamera((current) => ({ ...current, scale: clamp(current.scale - 0.2, 0.82, 2.8) }))} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><Minus size={17} weight="bold" /></button><button type="button" onClick={() => setCamera(initialCamera)} className="min-h-9 px-2 text-xs font-extrabold text-ink-muted hover:text-brand-deep">{Math.round(camera.scale * 100)}%</button><button aria-label="Perbesar peta" type="button" onClick={() => setCamera((current) => ({ ...current, scale: clamp(current.scale + 0.2, 0.82, 2.8) }))} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><Plus size={17} weight="bold" /></button><button aria-label="Reset peta" type="button" onClick={() => setCamera(initialCamera)} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><ArrowCounterClockwise size={16} weight="bold" /></button></div>
        </div>
        <div ref={viewportRef} {...bind()} onWheel={handleMapWheel} className="relative h-[min(68dvh,760px)] min-h-[35rem] touch-pan-y overflow-hidden bg-[#dce7e1]" aria-label="Denah interaktif OPAL. Scroll biasa tetap menggulir halaman. Seret dengan mouse untuk menggeser, cubit atau tahan Ctrl atau Command sambil scroll untuk memperbesar.">
          <motion.div className="absolute inset-0 origin-top-left" animate={camera} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 30, mass: 0.7 }}>
            <svg viewBox={`0 0 ${OPAL_MAP_VIEWBOX.width} ${OPAL_MAP_VIEWBOX.height}`} className="size-full select-none" role="img" aria-label="Denah top-down OPAL Residence dengan Gang 1, 2, 3, dan 5">
              <defs>
                <filter id="building-shadow" x="-20%" y="-30%" width="150%" height="180%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="1.4" floodColor="#214b3c" floodOpacity=".26" /></filter>
                <filter id="tree-shadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="1.2" floodColor="#1e4a32" floodOpacity=".35" /></filter>
                <pattern id="grass-grain" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#d7e6d8" /><path d="M2 7l3-2m8 14 3-2m5-11 2 2M7 24l2-3m13 3 3-2" stroke="#bfd5c3" strokeWidth="1" opacity=".72" /></pattern>
                <pattern id="asphalt-grain" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#aeb7b3" /><circle cx="3" cy="4" r=".6" fill="#929e98" /><circle cx="12" cy="10" r=".5" fill="#c1c8c5" /></pattern>
                <linearGradient id="roof-slate" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#7a8983" /><stop offset="1" stopColor="#4e6059" /></linearGradient>
                <linearGradient id="roof-warm" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#8b8278" /><stop offset="1" stopColor="#5c625c" /></linearGradient>
              </defs>
              <rect width={OPAL_MAP_VIEWBOX.width} height={OPAL_MAP_VIEWBOX.height} fill="url(#grass-grain)" />
              <path d="M68 60h1464v800H68z" fill="none" stroke="#35634a" strokeWidth="18" opacity=".92" />
              <path d="M92 84h1416v752H92z" fill="none" stroke="#eff6ee" strokeWidth="4" opacity=".85" />
              <rect x="112" y="102" width="1_376" height="718" rx="12" fill="#e8f0e8" stroke="#b6cbbd" strokeWidth="2" />
              <path d="M132 760h238v38H132zm1_046 0h286v38h-286zM704 748h192v54H704z" fill="#bdd9bf" stroke="#8cb58f" strokeWidth="2" />
              <path d="M130 111h1_340v38H130zM130 776h1_340v32H130z" fill="url(#asphalt-grain)" stroke="#8f9c96" strokeWidth="2" />
              {roadCenters.map((roadX) => <g key={roadX}><rect x={roadX - 22} y="112" width="44" height="666" rx="4" fill="url(#asphalt-grain)" stroke="#8b9892" strokeWidth="2" /><path d={`M${roadX} 124v642`} stroke="#f9fbf9" strokeWidth="1.75" strokeDasharray="8 9" opacity=".9" /><path d={`M${roadX - 21} 116v658M${roadX + 21} 116v658`} stroke="#e8eeea" strokeWidth="2" opacity=".9" /></g>)}
              {treeClusters.map(([x, y], index) => <g key={`${x}-${y}`} filter="url(#tree-shadow)"><circle cx={x} cy={y} r={17 + (index % 3) * 2} fill="#4f9658" /><circle cx={x - 8} cy={y - 5} r={11} fill="#69aa62" opacity=".94" /><circle cx={x + 9} cy={y - 6} r={9} fill="#3b7d48" opacity=".9" /></g>)}
              <g filter="url(#building-shadow)"><rect x="696" y="62" width="208" height="54" rx="5" fill="#eef4ef" stroke="#82988c" strokeWidth="2" /><rect x="730" y="72" width="140" height="22" rx="2" fill="url(#roof-slate)" /><path d="M800 72v22" stroke="#d6e1dc" strokeWidth="1.5" opacity=".8" /><rect x="778" y="95" width="44" height="21" fill="#c4cbc6" /></g>
              <g fontFamily="Manrope, sans-serif" fontWeight="800" fill="#35584c" textAnchor="middle"><text x="220" y="136" fontSize="12" letterSpacing="1">GANG 1</text><text x="580" y="136" fontSize="12" letterSpacing="1">GANG 2</text><text x="940" y="136" fontSize="12" letterSpacing="1">GANG 3</text><text x="1300" y="136" fontSize="12" letterSpacing="1">GANG 5</text><text x="800" y="98" fontSize="11" letterSpacing="2">GERBANG UTAMA</text><text x="800" y="790" fontSize="15" letterSpacing="5">OPAL RESIDENCE</text></g>
              {OPAL_MAP_SLOTS.map((slot) => {
                const property = propertyByUnit.get(slot.unitCode);
                const status = dataStatus(property);
                const visual = statusMeta[status];
                const selected = slot.unitCode === selectedUnit;
                const active = isActive(slot);
                const roofFill = Number(slot.houseNumber) % 3 === 0 ? "url(#roof-warm)" : "url(#roof-slate)";
                const drivewayX = slot.side === "west" ? slot.x + slot.width : slot.x - 8;
                const roofPoints = `${slot.x + 2},${slot.y + 2} ${slot.x + slot.width - 3},${slot.y + 2} ${slot.x + slot.width - 6},${slot.y + slot.height - 2} ${slot.x + 4},${slot.y + slot.height - 2}`;
                return <motion.g key={slot.unitCode} role="button" tabIndex={0} aria-label={`${slot.unitCode}, ${visual.label}`} aria-pressed={selected} onClick={() => focusSlot(slot)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); focusSlot(slot); } }} initial={false} animate={{ opacity: active || selected ? 1 : 0.15, scale: selected ? 1.14 : 1 }} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 24 }} style={{ transformOrigin: `${slot.x + slot.width / 2}px ${slot.y + slot.height / 2}px`, cursor: "pointer" }}>
                  <title>{`${slot.unitCode}: ${visual.label}`}</title><rect x={slot.x - 4} y={slot.y - 2} width={slot.width + 8} height={slot.height + 4} rx="2" fill="#d8e5d8" stroke="#b5c9b7" strokeWidth=".7" /><rect x={drivewayX} y={slot.y + 3} width="8" height={slot.height - 6} fill="#c0c9c3" /><polygon points={roofPoints} transform="translate(1.4 2)" fill="#344940" opacity=".25" /><polygon points={roofPoints} fill={roofFill} /><path d={`M${slot.x + 4} ${slot.y + 3}h${slot.width - 9}`} stroke="#dfe8e2" strokeWidth=".9" opacity=".7" /><rect x={slot.side === "west" ? slot.x + 1 : slot.x + slot.width - 5} y={slot.y + 1} width="4" height={slot.height - 2} rx="1" fill={visual.fill} /><rect x={slot.x - 4} y={slot.y - 2} width={slot.width + 8} height={slot.height + 4} rx="2" fill="none" stroke={selected ? "#072b23" : visual.stroke} strokeWidth={selected ? 2.6 : 1} strokeDasharray={status === "vacant" ? "3 2" : undefined} />
                  {selected || camera.scale > 1.7 ? <text x={slot.x + slot.width / 2} y={slot.y + 10} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="800" fill="#ffffff">{slot.houseNumber}</text> : null}
                </motion.g>;
              })}
            </svg>
          </motion.div>
          <div className="pointer-events-none absolute bottom-4 left-4 max-w-[18rem] rounded-xl border border-white/60 bg-white/92 px-3 py-2.5 text-xs font-semibold leading-5 text-ink-muted shadow-[0_10px_30px_rgba(8,48,41,0.12)]">Scroll tetap untuk halaman. Seret dengan mouse atau cubit untuk menjelajah peta. Tahan Ctrl atau Command sambil scroll untuk zoom.</div>
        </div>
      </section>
      <aside className="rounded-[22px] border border-[#c8d7d0] bg-[#f9fcfa] p-5 shadow-[0_22px_80px_rgba(7,43,35,0.08)]"><div className="flex items-center gap-2"><MapTrifold size={22} weight="duotone" className="text-brand" /><h2 className="font-black tracking-[-0.04em] text-ink">Tinjauan Atlas</h2></div><dl className="mt-5 space-y-4">{[
        ["Rumah terdaftar", properties.length], ["Perlu tindak lanjut", properties.filter((property) => mapStatus(property) === "attention").length], ["Iuran tertunda", properties.filter((property) => property.contributions.some((item) => item.status === "pending")).length], ["Belum ditempatkan", unplaced.length],
      ].map(([label, value]) => <div key={String(label)} className="flex items-end justify-between gap-4 border-b border-[#dce7e1] pb-3"><dt className="text-sm font-bold text-ink-muted">{label}</dt><dd className="text-2xl font-black tracking-[-0.06em] text-ink">{value}</dd></div>)}</dl>
        {unplaced.length ? <div className="mt-6 border-t border-[#dce7e1] pt-5"><p className="text-xs font-extrabold tracking-[0.12em] text-brand uppercase">Belum ditempatkan</p><p className="mt-2 text-sm leading-6 text-ink-muted">Unit ini ada di database, namun tidak cocok dengan slot denah tetap.</p><div className="mt-3 grid gap-2">{unplaced.map((property) => <button key={property.id} type="button" onClick={() => openProperty(property)} className="flex min-h-10 items-center justify-between border-b border-[#e1e9e4] text-left text-sm font-extrabold text-ink hover:text-brand-deep"><span>{property.unitCode}</span><CaretRight size={16} /></button>)}</div></div> : <p className="mt-6 border-t border-[#dce7e1] pt-5 text-sm leading-6 text-ink-muted">Semua unit yang ada saat ini telah memiliki slot denah.</p>}
      </aside>
    </div>
    <Dialog.Root open={Boolean(selectedUnit)} onOpenChange={(open) => { if (!open) clearSelection(); }}>
      <Dialog.Portal><Dialog.Overlay asChild><motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-[#06241d]/32 backdrop-blur-[2px]" /></Dialog.Overlay><Dialog.Content asChild><motion.aside initial={reducedMotion ? false : { opacity: 0, x: 40, y: 28 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30, mass: 0.82 }} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[26px] border border-[#c8d7d0] bg-[#fbfdfc] shadow-[-20px_0_80px_rgba(5,42,33,0.22)] outline-none lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[31rem] lg:max-h-none lg:rounded-none">
        <PropertyInspector key={selectedUnit} slot={selectedSlot} property={selectedProperty} />
      </motion.aside></Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}

function PropertyInspector({ slot, property }: { slot: MapSlot | null; property: PropertyMapSummary | undefined }) {
  const router = useRouter();
  const [tab, setTab] = useState<InspectorTab>(property ? "summary" : "family");
  const [editing, setEditing] = useState(!property);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const unit = property?.unitCode ?? slot?.unitCode ?? "Unit belum tersedia";
  const status = dataStatus(property);
  const visual = statusMeta[status];
  const latestContribution = property ? newestContribution(property.contributions.filter((item) => item.period)) : undefined;
  const latestRequest = property ? newest(property.requests) : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (property) formData.set("propertyId", property.id);
    startTransition(async () => {
      try {
        const result = await savePropertyProfile(formData);
        setMessage(result.message);
        setEditing(false);
        router.replace(`/admin/peta-rumah?unit=${encodeURIComponent(result.unitCode)}`, { scroll: false });
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Data rumah tidak dapat disimpan."); }
    });
  }

  function createLink() {
    if (!property) return;
    startTransition(async () => {
      try {
        const { url } = await createPropertyMapLink(property.id);
        await navigator.clipboard.writeText(url);
        setMessage("Tautan privat baru telah disalin. Kirim hanya kepada rumah terkait.");
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Tautan tidak dapat dibuat."); }
    });
  }

  return <>
    <div className="flex items-start justify-between border-b border-[#dce7e1] px-5 pb-4 pt-5 sm:px-6"><div><Dialog.Title className="text-2xl font-black tracking-[-0.065em] text-ink">{unit}</Dialog.Title><Dialog.Description className="mt-1 text-sm font-semibold text-ink-muted">{slot ? `Gang ${slot.gang} · Rumah ${slot.houseNumber}` : "Unit belum ditempatkan pada denah"}</Dialog.Description></div><Dialog.Close aria-label="Tutup detail rumah" className="grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-surface-subtle hover:text-ink"><X size={21} weight="bold" /></Dialog.Close></div>
    <div className="flex overflow-x-auto border-b border-[#dce7e1] px-3 py-2" role="tablist" aria-label="Informasi rumah">{([ ["summary", "Ringkasan"], ["family", "Keluarga"], ["contributions", "Iuran"], ["history", "Riwayat"] ] as Array<[InspectorTab, string]>).map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)} className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-extrabold ${tab === id ? "bg-action text-on-action" : "text-ink-muted hover:text-brand-deep"}`}>{label}</button>)}</div>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
      {message ? <p aria-live="polite" className="mb-4 rounded-xl border border-[#b9d9cd] bg-brand-soft px-3.5 py-3 text-sm font-bold leading-6 text-brand-deep">{message}</p> : null}
      {tab === "summary" ? <div className="space-y-5"><div className="flex items-center justify-between gap-3"><span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold ${visual.panel}`}>{visual.label}</span>{property?.occupancyStatus ? <span className="text-xs font-bold text-ink-muted">{occupancyLabels[property.occupancyStatus]}</span> : null}</div>{property ? <><InfoRow label="Penanggung jawab" value={property.profile?.responsibleName ?? "Belum disahkan"} /><InfoRow label="WhatsApp" value={property.profile?.whatsapp ?? "Belum tersedia"} action={property.profile?.whatsapp ? <a href={`https://wa.me/62${property.profile.whatsapp.replace(/^0/, "")}`} target="_blank" rel="noreferrer" className="text-brand hover:text-brand-deep">Pesan</a> : undefined} /><div className="border-y border-[#dce7e1] py-4"><p className="text-xs font-extrabold tracking-[0.1em] text-ink-faint uppercase">Akses rumah privat</p><p className="mt-2 text-sm leading-6 text-ink-muted">{property.accessLinkActive ? "Tautan aktif. Putar bila penerima berubah." : "Belum ada tautan untuk rumah ini."}</p><button type="button" disabled={isPending} onClick={createLink} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-action px-3.5 text-xs font-extrabold text-on-action hover:bg-brand disabled:opacity-60"><Copy size={16} weight="bold" />{property.accessLinkActive ? "Putar & salin tautan" : "Buat & salin tautan"}</button></div></> : <p className="text-sm leading-7 text-ink-muted">Slot ini belum memiliki data rumah. Tambahkan unit dan informasi keluarga di bawah.</p>}<button type="button" onClick={() => { setTab("family"); setEditing(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#bfd2c9] px-3.5 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep"><HouseLine size={18} weight="bold" />{property ? "Perbarui data rumah" : "Tambahkan rumah"}</button></div> : null}
      {tab === "family" ? <div>{editing ? <PropertyForm slot={slot} property={property} isPending={isPending} onSubmit={submit} /> : property?.profile ? <div className="space-y-4"><InfoRow label="Kepala keluarga" value={property.profile.headOfHouseholdName} /><InfoRow label="Pekerjaan" value={occupationLabels[property.profile.headOfHouseholdOccupation] ?? property.profile.headOfHouseholdOccupation} /><InfoRow label="Jumlah penghuni" value={`${property.profile.occupantsCount} orang`} /><InfoRow label="Alamat" value={property.profile.responsibleAddress} /><InfoRow label="Email" value={property.profile.contactEmail} /><div className="border-t border-[#dce7e1] pt-5"><p className="text-xs font-extrabold tracking-[0.1em] text-ink-faint uppercase">Bukti identitas</p><p className="mt-2 text-sm leading-6 text-ink-muted">Bukti tidak dimuat di peta. Bukalah hanya bila diperlukan untuk pemeriksaan.</p>{property.latestSubmission?.evidence.length ? <div className="mt-3 grid gap-2">{property.latestSubmission.evidence.map((evidence) => <a key={evidence.id} href={`/api/admin/evidence/${evidence.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-between rounded-xl border border-[#bfd2c9] px-3 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep"><span className="truncate">{evidence.originalName}</span><CaretRight size={16} /></a>)}</div> : <p className="mt-3 text-sm font-bold text-ink-muted">Belum ada bukti untuk pendataan terakhir.</p>}</div><button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#bfd2c9] px-3.5 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep">Perbarui data</button></div> : <div className="rounded-xl border border-dashed border-[#bfd2c9] p-4 text-sm leading-6 text-ink-muted">Belum ada profil keluarga yang disahkan. <button type="button" onClick={() => setEditing(true)} className="font-extrabold text-brand underline underline-offset-4">Isi sekarang</button></div>}</div> : null}
      {tab === "contributions" ? <div className="space-y-4">{property ? <><div className="rounded-xl border border-[#dce7e1] bg-[#f4f8f5] p-4"><p className="text-xs font-extrabold tracking-[0.1em] text-ink-faint uppercase">Status terakhir</p><p className="mt-2 text-lg font-black tracking-[-0.04em] text-ink">{latestContribution ? latestContribution.status === "paid" ? "Tercatat dibayar" : latestContribution.status === "pending" ? "Perlu ditindaklanjuti" : "Dibebaskan" : "Belum ada catatan"}</p><p className="mt-1 text-sm text-ink-muted">{latestContribution ? formatMonth(latestContribution.period) : "Siapkan iuran dari dashboard utama."}</p></div>{property.contributions.length ? <div className="divide-y divide-[#dce7e1]">{property.contributions.slice(0, 8).map((item, index) => <div key={`${item.period}-${index}`} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-extrabold text-ink">{formatMonth(item.period)}</p><p className="mt-1 text-xs font-bold text-ink-muted">Rp {item.amountRupiah.toLocaleString("id-ID")}</p></div><span className={`text-xs font-extrabold ${item.status === "paid" ? "text-brand-deep" : item.status === "pending" ? "text-[#80570d]" : "text-ink-muted"}`}>{item.status === "paid" ? "Dibayar" : item.status === "pending" ? "Tertunda" : "Dibebaskan"}</span></div>)}</div> : null}</> : <p className="text-sm leading-7 text-ink-muted">Simpan rumah terlebih dahulu untuk melihat iuran.</p>}</div> : null}
      {tab === "history" ? <div className="space-y-5">{property ? <><HistoryItem icon={<CheckCircle size={18} weight="fill" />} title={property.latestSubmission ? `Pendataan: ${property.latestSubmission.status.replaceAll("_", " ")}` : "Belum ada pendataan"} detail={property.latestSubmission ? formatDate(property.latestSubmission.createdAt) : "Warga belum mengirim formulir"} />{latestRequest ? <HistoryItem icon={<Receipt size={18} weight="fill" />} title={`Surat: ${latestRequest.requestType === "move" ? "pindah rumah" : latestRequest.requestType === "domicile" ? "domisili" : "belum menikah"}`} detail={`${latestRequest.status.replaceAll("_", " ")} · ${formatDate(latestRequest.createdAt)}`} /> : <HistoryItem icon={<Prohibit size={18} weight="bold" />} title="Belum ada pengajuan surat" detail="Riwayat surat akan muncul di sini." />}</> : <p className="text-sm leading-7 text-ink-muted">Riwayat akan tersedia setelah rumah dibuat.</p>}</div> : null}
    </div>
  </>;
}

function PropertyForm({ slot, property, isPending, onSubmit }: { slot: MapSlot | null; property: PropertyMapSummary | undefined; isPending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const profile = property?.profile;
  return <form onSubmit={onSubmit} className="grid gap-4"><p className="text-sm leading-6 text-ink-muted">{property ? "Perbarui informasi operasional rumah. Kosongkan seluruh data keluarga hanya bila rumah memang belum memiliki profil." : "Buat rumah pada slot ini. Data keluarga dapat langsung dilengkapi atau diisi nanti."}</p><div className="grid grid-cols-2 gap-3"><Field label="Gang"><select name="gang" defaultValue={property?.gang ?? slot?.gang ?? 1}><option value="1">Gang 1</option><option value="2">Gang 2</option><option value="3">Gang 3</option><option value="5">Gang 5</option></select></Field><Field label="Nomor rumah"><input name="houseNumber" required defaultValue={property?.houseNumber ?? slot?.houseNumber ?? ""} inputMode="numeric" /></Field></div><Field label="Status hunian"><select name="occupancyStatus" defaultValue={property?.occupancyStatus ?? ""}><option value="">Belum disahkan</option><option value="self">Dihuni sendiri</option><option value="relative">Dihuni kerabat</option><option value="tenant">Dihuni penyewa</option><option value="vacant_rent">Kosong, disewakan</option><option value="vacant_sale">Kosong, dijual</option></select></Field><div className="border-t border-[#dce7e1] pt-4"><p className="text-xs font-extrabold tracking-[0.1em] text-ink-faint uppercase">Profil keluarga</p></div><Field label="Penanggung jawab"><input name="responsibleName" defaultValue={profile?.responsibleName ?? ""} /></Field><Field label="Alamat penanggung jawab"><textarea name="responsibleAddress" defaultValue={profile?.responsibleAddress ?? ""} /></Field><div className="grid grid-cols-2 gap-3"><Field label="WhatsApp"><input name="whatsapp" defaultValue={profile?.whatsapp ?? ""} inputMode="tel" /></Field><Field label="Email"><input name="contactEmail" type="email" defaultValue={profile?.contactEmail ?? ""} /></Field></div><Field label="Kepala keluarga"><input name="headOfHouseholdName" defaultValue={profile?.headOfHouseholdName ?? ""} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Pekerjaan"><select name="headOfHouseholdOccupation" defaultValue={profile?.headOfHouseholdOccupation ?? ""}><option value="">Pilih</option><option value="employee">Pegawai</option><option value="entrepreneur">Wiraswasta</option><option value="student">Pelajar</option></select></Field><Field label="Jumlah penghuni"><input name="occupantsCount" type="number" min="1" max="30" defaultValue={profile?.occupantsCount ?? ""} /></Field></div><button disabled={isPending} className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action hover:bg-brand disabled:opacity-60">{isPending ? <SpinnerGap size={18} className="animate-spin" /> : <CheckCircle size={18} weight="bold" />}{isPending ? "Menyimpan…" : "Simpan data rumah"}</button></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-extrabold text-ink [&>input]:min-h-11 [&>input]:rounded-xl [&>input]:border [&>input]:border-[#bfd2c9] [&>input]:bg-white [&>input]:px-3 [&>input]:text-sm [&>input]:font-semibold [&>input]:outline-none [&>input]:focus:border-brand [&>input]:focus:ring-3 [&>input]:focus:ring-brand/15 [&>select]:min-h-11 [&>select]:rounded-xl [&>select]:border [&>select]:border-[#bfd2c9] [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-semibold [&>select]:outline-none [&>select]:focus:border-brand [&>select]:focus:ring-3 [&>select]:focus:ring-brand/15 [&>textarea]:min-h-20 [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-[#bfd2c9] [&>textarea]:bg-white [&>textarea]:p-3 [&>textarea]:text-sm [&>textarea]:font-semibold [&>textarea]:outline-none [&>textarea]:focus:border-brand [&>textarea]:focus:ring-3 [&>textarea]:focus:ring-brand/15"><span>{label}</span>{children}</label>;
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#dce7e1] pb-3"><div><p className="text-xs font-extrabold tracking-[0.1em] text-ink-faint uppercase">{label}</p><p className="mt-1 text-sm font-extrabold leading-6 text-ink">{value}</p></div>{action}</div>;
}

function HistoryItem({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface-subtle text-brand">{icon}</span><div><p className="text-sm font-extrabold text-ink">{title}</p><p className="mt-1 text-sm leading-6 text-ink-muted">{detail}</p></div></div>;
}
