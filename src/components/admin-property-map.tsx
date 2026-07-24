"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent, StyleSpecification } from "maplibre-gl";
import { ArrowCounterClockwise, CaretRight, CheckCircle, Copy, Crosshair, HouseLine, MagnifyingGlass, MapPin, MapTrifold, Minus, Plus, SpinnerGap, Trash, X } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPropertyMapLink, removePropertyMapPosition, savePropertyMapPosition, savePropertyProfile } from "@/app/admin/actions";
import { shouldZoomMapFromWheel } from "@/lib/opal-map-gesture";
import { mapStatus, OPAL_ATLAS_CENTER, OPAL_ATLAS_DEFAULT_ZOOM, searchProperties, streetForGang, type PropertyMapStatus, type PropertyMapSummary, unplacedProperties } from "@/lib/opal-map-layout";

type MapFilter = "all" | PropertyMapStatus;
type InspectorTab = "summary" | "family" | "contributions" | "history";
type Coordinates = { lat: number; lng: number };

const atlasStyles: Record<"satellite" | "roadmap", StyleSpecification> = {
  satellite: {
    version: 8,
    sources: { imagery: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "© Esri, Maxar, Earthstar Geographics" } },
    layers: [{ id: "imagery", type: "raster", source: "imagery" }],
  },
  roadmap: {
    version: 8,
    sources: { streets: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
    layers: [{ id: "streets", type: "raster", source: "streets" }],
  },
};

const statusMeta: Record<PropertyMapStatus, { label: string; color: string; panel: string }> = {
  verified: { label: "Data sah", color: "#0d7b6f", panel: "bg-brand-soft text-brand-deep" },
  attention: { label: "Perlu tindak lanjut", color: "#bd7b1b", panel: "bg-[#f7e8ca] text-[#754a08]" },
  missing: { label: "Belum ada data", color: "#73817c", panel: "bg-surface-subtle text-ink-muted" },
  vacant: { label: "Unit kosong", color: "#a7b1ad", panel: "bg-surface-raised text-ink-muted" },
};

function statusOf(property: PropertyMapSummary) { return mapStatus(property); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value)); }
function formatMonth(value: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "Belum tercatat"; }
function newest<T extends { createdAt?: string; period?: string | null }>(items: T[]) { return [...items].sort((a, b) => String(b.createdAt ?? b.period ?? "").localeCompare(String(a.createdAt ?? a.period ?? "")))[0]; }

export function AdminPropertyMap({ properties, initialUnit }: { properties: PropertyMapSummary[]; initialUnit?: string }) {
  const router = useRouter();
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const calibrationRef = useRef({ enabled: false, targetId: null as string | null });
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const reducedMotion = useReducedMotion();
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(() => properties.find((property) => property.unitCode === initialUnit)?.id ?? null);
  const [mapType, setMapType] = useState<"satellite" | "roadmap">("satellite");
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationTargetId, setCalibrationTargetId] = useState<string | null>(null);
  const [pendingPosition, setPendingPosition] = useState<Coordinates | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  useEffect(() => { calibrationRef.current = { enabled: calibrating, targetId: calibrationTargetId }; }, [calibrating, calibrationTargetId]);
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties]);
  const selected = selectedId ? propertyById.get(selectedId) ?? null : null;
  const searchResults = useMemo(() => searchProperties(properties, query), [properties, query]);
  const unplaced = useMemo(() => unplacedProperties(properties), [properties]);
  const visibleProperties = useMemo(() => properties.filter((property) => filter === "all" || statusOf(property) === filter), [filter, properties]);
  const calibratedCount = properties.length - unplaced.length;

  const selectProperty = useCallback((property: PropertyMapSummary, open = true) => {
    setSelectedId(property.id);
    if (property.position && map) {
      const center = { lat: property.position.latitude, lng: property.position.longitude };
      const camera = { center, zoom: Math.max(map.getZoom(), 20) };
      if (reducedMotion) map.jumpTo(camera); else map.flyTo({ ...camera, essential: true, duration: 680 });
    }
    router.replace(`/admin/peta-rumah?unit=${encodeURIComponent(property.unitCode)}`, { scroll: false });
    if (!open) return;
  }, [map, reducedMotion, router]);

  useEffect(() => {
    if (!initialUnit) return;
    const property = properties.find((item) => item.unitCode === initialUnit);
    if (!property) return;
    if (property.position && map) {
      const center = { lat: property.position.latitude, lng: property.position.longitude };
      const camera = { center, zoom: Math.max(map.getZoom(), 20) };
      if (reducedMotion) map.jumpTo(camera); else map.flyTo({ ...camera, essential: true, duration: 680 });
    }
  }, [initialUnit, map, properties, reducedMotion]);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;
    try {
      const nextMap = new maplibregl.Map({
        container: mapElement.current,
        style: atlasStyles.satellite,
        center: [OPAL_ATLAS_CENTER.lng, OPAL_ATLAS_CENTER.lat],
        zoom: OPAL_ATLAS_DEFAULT_ZOOM,
        cooperativeGestures: true,
        maxPitch: 0,
      });
      nextMap.scrollZoom.enable();
      nextMap.dragPan.enable();
      nextMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      nextMap.on("click", (event: MapMouseEvent) => {
        if (!calibrationRef.current.enabled || !calibrationRef.current.targetId) return;
        setPendingPosition({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });
      nextMap.on("error", () => setLoadError("Citra peta belum dapat dimuat. Periksa koneksi internet lalu coba lagi."));
      mapRef.current = nextMap;
      setMap(nextMap);
      return () => { nextMap.remove(); mapRef.current = null; };
    } catch {
      setLoadError("Perangkat ini belum mendukung peta WebGL.");
    }
  }, []);

  useEffect(() => {
    const element = mapElement.current;
    if (!element) return;
    const interceptBrowserZoom = (event: WheelEvent) => {
      if (shouldZoomMapFromWheel(event) && event.cancelable) event.preventDefault();
    };
    element.addEventListener("wheel", interceptBrowserZoom, { capture: true, passive: false });
    return () => element.removeEventListener("wheel", interceptBrowserZoom, true);
  }, []);

  useEffect(() => { if (map) map.setStyle(atlasStyles[mapType]); }, [map, mapType]);

  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    const markers: maplibregl.Marker[] = [];
    const updateLabelVisibility = () => {
      const close = map.getZoom() >= 18.4;
      markers.forEach((marker) => {
        const kind = marker.getElement().dataset.atlasKind;
        marker.getElement().style.display = kind === "unit" ? (close ? "block" : "none") : (close ? "none" : "block");
      });
    };
    visibleProperties.filter((property) => property.position).forEach((property) => {
      const meta = statusMeta[statusOf(property)];
      const button = document.createElement("button");
      button.type = "button"; button.dataset.atlasKind = "unit"; button.title = `${streetForGang(property.gang).name}, No. ${property.houseNumber}`;
      button.setAttribute("aria-label", `${property.unitCode}, ${meta.label}`); button.textContent = property.houseNumber;
      button.style.cssText = `min-width:30px;height:25px;padding:0 7px;border:1px solid rgba(255,255,255,.95);border-bottom:3px solid ${meta.color};border-radius:7px;background:rgba(255,255,255,.96);color:#12352f;font:800 11px Manrope,system-ui,sans-serif;box-shadow:0 3px 12px rgba(5,37,29,.28);cursor:pointer;transition:${reducedMotion ? "none" : "transform .18s ease,box-shadow .18s ease"};`;
      button.addEventListener("mouseenter", () => { button.style.transform = "translateY(-3px) scale(1.08)"; }); button.addEventListener("mouseleave", () => { button.style.transform = ""; });
      button.addEventListener("click", () => { selectProperty(property); if (calibrating) setCalibrationTargetId(property.id); });
      markers.push(new maplibregl.Marker({ element: button, anchor: "bottom" }).setLngLat([property.position!.longitude, property.position!.latitude]).addTo(map));
    });
    [1, 2, 3, 5].forEach((gang) => {
      const onStreet = visibleProperties.filter((property) => property.gang === gang && property.position);
      if (!onStreet.length) return;
      const latitude = onStreet.reduce((total, property) => total + property.position!.latitude, 0) / onStreet.length;
      const longitude = onStreet.reduce((total, property) => total + property.position!.longitude, 0) / onStreet.length;
      const numbers = onStreet.map((property) => Number(property.houseNumber)).filter(Number.isFinite).sort((a, b) => a - b);
      const label = document.createElement("div"); label.dataset.atlasKind = "range";
      label.textContent = `${streetForGang(gang).shortName}  ${String(numbers[0]).padStart(2, "0")}–${String(numbers[numbers.length - 1]).padStart(2, "0")}`;
      label.style.cssText = "white-space:nowrap;border-radius:999px;background:rgba(10,36,31,.84);padding:6px 9px;color:white;font:800 10px Manrope,system-ui,sans-serif;letter-spacing:.04em;box-shadow:0 5px 18px rgba(0,0,0,.22);pointer-events:none;";
      markers.push(new maplibregl.Marker({ element: label, anchor: "center" }).setLngLat([longitude, latitude]).addTo(map));
    });
    markersRef.current = markers; updateLabelVisibility(); map.on("zoom", updateLabelVisibility);
    return () => { map.off("zoom", updateLabelVisibility); markers.forEach((marker) => marker.remove()); };
  }, [calibrating, map, reducedMotion, selectProperty, visibleProperties]);

  function enterSearch(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !searchResults[0]) return;
    event.preventDefault();
    selectProperty(searchResults[0]);
    setQuery("");
  }

  function saveCalibration() {
    if (!calibrationTargetId || !pendingPosition) return;
    startTransition(async () => {
      try {
        const result = await savePropertyMapPosition({ propertyId: calibrationTargetId, latitude: pendingPosition.lat, longitude: pendingPosition.lng });
        setMessage(result.message);
        setPendingPosition(null);
        setCalibrationTargetId(null);
        router.refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Posisi belum dapat disimpan."); }
    });
  }

  return <main className="min-h-[100dvh] bg-[#edf3f0] p-3 sm:p-5">
    <div className="mx-auto grid max-w-[1720px] gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-[20px] border border-[#c8d7d0] bg-[#f9fcfa] shadow-[0_22px_74px_rgba(7,43,35,.11)]">
        <header className="flex flex-col gap-4 border-b border-[#d7e2dc] px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div><p className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-brand">OPAL Atlas</p><h1 className="mt-1 text-2xl font-black tracking-[-.06em] text-ink sm:text-3xl">Peta operasional rumah</h1></div>
          <div className="flex items-center gap-2 text-xs font-bold text-ink-muted"><MapPin size={16} weight="fill" className="text-brand" />Cluster OPAL · Citra satelit</div>
        </header>
        <div className="relative grid gap-3 border-b border-[#d7e2dc] bg-[#f4f8f5] p-3 lg:grid-cols-[minmax(18rem,1fr)_auto_auto] lg:px-5">
          <label className="relative block"><MagnifyingGlass size={18} weight="bold" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={enterSearch} type="search" placeholder="Cari 14, DS II 14, OP 3 - 14, atau nama" className="min-h-11 w-full rounded-xl border border-[#cddbd5] bg-white px-4 pl-10 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15" /></label>
          <div className="flex overflow-x-auto rounded-xl border border-[#cddbd5] bg-white p-1">{(["all", "attention", "verified", "missing", "vacant"] as MapFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-extrabold ${filter === item ? "bg-action text-on-action" : "text-ink-muted hover:text-brand-deep"}`}>{item === "all" ? "Semua" : statusMeta[item].label}</button>)}</div>
          <div className="flex rounded-xl border border-[#cddbd5] bg-white p-1"><button aria-label="Perkecil peta" onClick={() => map?.zoomOut()} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><Minus size={17} weight="bold" /></button><button type="button" onClick={() => map?.jumpTo({ center: [OPAL_ATLAS_CENTER.lng, OPAL_ATLAS_CENTER.lat], zoom: OPAL_ATLAS_DEFAULT_ZOOM })} className="min-h-9 px-2 text-xs font-extrabold text-ink-muted">Reset</button><button aria-label="Perbesar peta" onClick={() => map?.zoomIn()} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><Plus size={17} weight="bold" /></button><button aria-label="Pusatkan peta" onClick={() => map?.jumpTo({ center: [OPAL_ATLAS_CENTER.lng, OPAL_ATLAS_CENTER.lat], zoom: OPAL_ATLAS_DEFAULT_ZOOM })} className="grid size-9 place-items-center rounded-lg text-ink hover:bg-surface-subtle"><ArrowCounterClockwise size={16} weight="bold" /></button></div>
          {query && searchResults.length ? <div className="absolute left-3 right-3 top-[4.65rem] z-20 overflow-hidden rounded-xl border border-[#c8d7d0] bg-white shadow-[0_18px_45px_rgba(7,43,35,.16)] lg:right-auto lg:w-[min(38rem,calc(100%-24rem))]">{searchResults.map((property) => <button key={property.id} type="button" onClick={() => { selectProperty(property); setQuery(""); }} className="flex w-full items-center justify-between gap-4 border-b border-[#e1e9e4] px-4 py-3 text-left last:border-b-0 hover:bg-[#f2f8f5]"><span className="min-w-0"><strong className="block text-sm text-ink">{streetForGang(property.gang).name} · No. {property.houseNumber}</strong><span className="mt-1 block truncate text-xs font-semibold text-ink-muted">{property.profile?.responsibleName ?? "Belum ada penanggung jawab"}</span></span><span className="shrink-0 text-xs font-extrabold text-brand-deep">{property.position ? "Terpasang" : "Belum dipasang"}</span></button>)}</div> : null}
        </div>
        <div className={`relative h-[min(69dvh,790px)] min-h-[34rem] bg-[#dce7e1] ${calibrating ? "cursor-crosshair" : ""}`} aria-label="Peta satelit interaktif Cluster OPAL. Scroll halaman tetap normal; gunakan Ctrl atau Command sambil scroll untuk memperbesar peta.">
          <div ref={mapElement} tabIndex={0} className="opal-atlas-map size-full touch-pan-y outline-none focus-visible:ring-4 focus-visible:ring-brand/35" />
          {loadError ? <div className="absolute inset-0 grid place-items-center bg-[#eef4f1] p-6 text-center"><p className="max-w-md text-sm font-bold leading-7 text-ink-muted">{loadError}</p></div> : null}
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-ink-muted shadow-[0_8px_28px_rgba(8,48,41,.18)]">Scroll halaman tetap normal. Ctrl atau Command + scroll untuk zoom peta.</div>
          <div className="absolute right-4 top-4 flex rounded-xl border border-white/70 bg-white/95 p-1 shadow-[0_8px_28px_rgba(8,48,41,.18)]"><button type="button" onClick={() => setMapType("satellite")} className={`min-h-9 rounded-lg px-3 text-xs font-extrabold ${mapType === "satellite" ? "bg-action text-on-action" : "text-ink-muted"}`}>Satelit</button><button type="button" onClick={() => setMapType("roadmap")} className={`min-h-9 rounded-lg px-3 text-xs font-extrabold ${mapType === "roadmap" ? "bg-action text-on-action" : "text-ink-muted"}`}>Jalan</button></div>
        </div>
      </section>
      <aside className="rounded-[20px] border border-[#c8d7d0] bg-[#f9fcfa] p-5 shadow-[0_22px_74px_rgba(7,43,35,.08)]"><div className="flex items-center gap-2"><MapTrifold size={22} weight="duotone" className="text-brand" /><h2 className="font-black tracking-[-.04em] text-ink">Tinjauan Atlas</h2></div><dl className="mt-5 space-y-4">{[["Rumah terdaftar", properties.length], ["Sudah terpasang", calibratedCount], ["Perlu tindak lanjut", properties.filter((property) => statusOf(property) === "attention").length], ["Belum dipasang", unplaced.length]].map(([label, value]) => <div key={String(label)} className="flex items-end justify-between gap-3 border-b border-[#dce7e1] pb-3"><dt className="text-sm font-bold text-ink-muted">{label}</dt><dd className="text-2xl font-black tracking-[-.06em] text-ink">{value}</dd></div>)}</dl>
        <div className="mt-6 border-t border-[#dce7e1] pt-5"><button type="button" onClick={() => { setCalibrating((value) => !value); setPendingPosition(null); }} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold ${calibrating ? "bg-action text-on-action" : "border border-[#bfd2c9] text-ink hover:border-brand hover:text-brand-deep"}`}><Crosshair size={18} weight="bold" />{calibrating ? "Selesai kalibrasi" : "Kalibrasi Atlas"}</button>{calibrating ? <CalibrationPanel properties={unplaced} targetId={calibrationTargetId} pendingPosition={pendingPosition} isPending={isPending} onTarget={setCalibrationTargetId} onSave={saveCalibration} /> : <p className="mt-3 text-sm leading-6 text-ink-muted">Pilih Kalibrasi Atlas, pilih unit, lalu klik pusat bangunan pada citra asli.</p>}</div>
      </aside>
    </div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelectedId(null); router.replace("/admin/peta-rumah", { scroll: false }); } }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-[#072b23]/35" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[84dvh] flex-col rounded-t-[22px] bg-[#fbfdfc] shadow-[0_-18px_60px_rgba(4,31,24,.24)] focus:outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(34rem,92vw)] sm:max-h-none sm:rounded-none" aria-describedby={undefined}>{selected ? <PropertyInspector property={selected} isPending={isPending} message={message} onMessage={setMessage} onRefresh={() => router.refresh()} onCalibrate={() => { setCalibrating(true); setCalibrationTargetId(selected.id); setPendingPosition(null); }} onRemovePosition={() => startTransition(async () => { try { const result = await removePropertyMapPosition(selected.id); setMessage(result.message); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Posisi belum dapat dihapus."); } })} /> : null}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}


function CalibrationPanel({ properties, targetId, pendingPosition, isPending, onTarget, onSave }: { properties: PropertyMapSummary[]; targetId: string | null; pendingPosition: Coordinates | null; isPending: boolean; onTarget: (id: string) => void; onSave: () => void }) { return <div className="mt-4"><p className="text-xs font-extrabold uppercase tracking-[.12em] text-brand">Unit belum dipasang</p><div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-[#dce7e1]">{properties.length ? properties.map((property) => <button key={property.id} type="button" onClick={() => onTarget(property.id)} className={`flex min-h-10 w-full items-center justify-between border-b border-[#e1e9e4] px-3 text-left text-sm font-extrabold last:border-b-0 ${targetId === property.id ? "bg-brand-soft text-brand-deep" : "text-ink hover:bg-surface-subtle"}`}><span>{streetForGang(property.gang).shortName} · {property.houseNumber}</span><CaretRight size={16} /></button>) : <p className="p-3 text-sm leading-6 text-ink-muted">Semua rumah yang terdaftar telah dipasang.</p>}</div>{targetId ? <p className="mt-3 text-sm font-bold leading-6 text-ink-muted">Klik pusat bangunan pada citra. Koordinat tidak disimpan sampai Anda menekan tombol simpan.</p> : null}{pendingPosition ? <button type="button" disabled={isPending} onClick={onSave} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-action px-3 text-sm font-extrabold text-on-action disabled:opacity-60">{isPending ? <SpinnerGap size={18} className="animate-spin" /> : <CheckCircle size={18} weight="bold" />}Simpan posisi ini</button> : null}</div>; }

function PropertyInspector({ property, isPending, message, onMessage, onRefresh, onCalibrate, onRemovePosition }: { property: PropertyMapSummary; isPending: boolean; message: string; onMessage: (value: string) => void; onRefresh: () => void; onCalibrate: () => void; onRemovePosition: () => void }) {
  const router = useRouter(); const [tab, setTab] = useState<InspectorTab>("summary"); const [editing, setEditing] = useState(false); const [saving, startTransition] = useTransition(); const status = statusOf(property); const latestContribution = newest(property.contributions); const latestRequest = newest(property.requests);
  function saveProfile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); form.set("propertyId", property.id); startTransition(async () => { try { const result = await savePropertyProfile(form); onMessage(result.message); setEditing(false); router.replace(`/admin/peta-rumah?unit=${encodeURIComponent(result.unitCode)}`, { scroll: false }); onRefresh(); } catch (error) { onMessage(error instanceof Error ? error.message : "Data rumah belum dapat disimpan."); } }); }
  function copyLink() { startTransition(async () => { try { const { url } = await createPropertyMapLink(property.id); await navigator.clipboard.writeText(url); onMessage("Tautan privat baru telah disalin."); onRefresh(); } catch (error) { onMessage(error instanceof Error ? error.message : "Tautan belum dapat dibuat."); } }); }
  return <><div className="flex items-start justify-between border-b border-[#dce7e1] px-5 py-5"><div><Dialog.Title className="text-2xl font-black tracking-[-.06em] text-ink">{property.unitCode}</Dialog.Title><Dialog.Description className="mt-1 text-sm font-semibold text-ink-muted">{streetForGang(property.gang).name} · No. {property.houseNumber}</Dialog.Description></div><Dialog.Close aria-label="Tutup detail rumah" className="grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-surface-subtle"><X size={21} weight="bold" /></Dialog.Close></div><div className="flex overflow-x-auto border-b border-[#dce7e1] px-3 py-2">{([["summary", "Ringkasan"], ["family", "Keluarga"], ["contributions", "Iuran"], ["history", "Riwayat"]] as Array<[InspectorTab, string]>).map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-extrabold ${tab === id ? "bg-action text-on-action" : "text-ink-muted hover:text-brand-deep"}`}>{label}</button>)}</div><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{message ? <p aria-live="polite" className="mb-4 rounded-xl border border-[#b9d9cd] bg-brand-soft px-3 py-3 text-sm font-bold leading-6 text-brand-deep">{message}</p> : null}{tab === "summary" ? <div className="space-y-5"><span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-extrabold ${statusMeta[status].panel}`}>{statusMeta[status].label}</span><InfoRow label="Penanggung jawab" value={property.profile?.responsibleName ?? "Belum disahkan"} /><InfoRow label="WhatsApp" value={property.profile?.whatsapp ?? "Belum tersedia"} /> <button type="button" onClick={copyLink} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-3.5 text-sm font-extrabold text-on-action disabled:opacity-60"><Copy size={17} weight="bold" />{property.accessLinkActive ? "Putar & salin tautan" : "Buat & salin tautan"}</button><div className="border-t border-[#dce7e1] pt-5"><p className="text-sm font-bold leading-6 text-ink-muted">{property.position ? "Posisi rumah sudah dipasang pada citra asli." : "Rumah ini belum dipasang pada peta."}</p><button type="button" onClick={onCalibrate} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#bfd2c9] px-3 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep"><Crosshair size={17} weight="bold" />{property.position ? "Koreksi posisi" : "Pasang posisi"}</button>{property.position ? <button type="button" onClick={onRemovePosition} disabled={isPending} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-danger disabled:opacity-60"><Trash size={17} weight="bold" />Hapus dari peta</button> : null}</div><button type="button" onClick={() => { setTab("family"); setEditing(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#bfd2c9] px-3.5 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep"><HouseLine size={18} weight="bold" />Perbarui data rumah</button></div> : null}{tab === "family" ? <div>{editing ? <PropertyForm property={property} isPending={saving} onSubmit={saveProfile} /> : <div className="space-y-4"><InfoRow label="Kepala keluarga" value={property.profile?.headOfHouseholdName ?? "Belum tersedia"} /><InfoRow label="Pekerjaan" value={property.profile?.headOfHouseholdOccupation ?? "Belum tersedia"} /><InfoRow label="Jumlah penghuni" value={property.profile ? `${property.profile.occupantsCount} orang` : "Belum tersedia"} /><InfoRow label="Alamat" value={property.profile?.responsibleAddress ?? "Belum tersedia"} /><InfoRow label="Email" value={property.profile?.contactEmail ?? "Belum tersedia"} /><div className="border-t border-[#dce7e1] pt-5"><p className="text-xs font-extrabold uppercase tracking-[.1em] text-ink-faint">Bukti identitas</p><p className="mt-2 text-sm leading-6 text-ink-muted">Bukti tidak dibawa ke payload peta. Buka hanya saat pemeriksaan diperlukan.</p>{property.latestSubmission?.evidence.map((evidence) => <a key={evidence.id} href={`/api/admin/evidence/${evidence.id}`} target="_blank" rel="noreferrer" className="mt-2 flex min-h-10 items-center justify-between rounded-xl border border-[#bfd2c9] px-3 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep"><span className="truncate">{evidence.originalName}</span><CaretRight size={16} /></a>)}</div><button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 rounded-xl border border-[#bfd2c9] px-3.5 text-sm font-extrabold text-ink hover:border-brand hover:text-brand-deep">Perbarui data</button></div>}</div> : null}{tab === "contributions" ? <div className="space-y-4"><InfoRow label="Status terakhir" value={latestContribution ? latestContribution.status === "paid" ? "Tercatat dibayar" : latestContribution.status === "pending" ? "Perlu ditindaklanjuti" : "Dibebaskan" : "Belum ada catatan"} />{property.contributions.slice(0, 8).map((item, index) => <InfoRow key={`${item.period}-${index}`} label={formatMonth(item.period)} value={`Rp ${item.amountRupiah.toLocaleString("id-ID")} · ${item.status === "paid" ? "Dibayar" : item.status === "pending" ? "Tertunda" : "Dibebaskan"}`} />)}</div> : null}{tab === "history" ? <div className="space-y-4"><InfoRow label="Pendataan" value={property.latestSubmission ? `${property.latestSubmission.status.replaceAll("_", " ")} · ${formatDate(property.latestSubmission.createdAt)}` : "Belum ada pendataan"} /><InfoRow label="Surat terakhir" value={latestRequest ? `${latestRequest.requestType} · ${latestRequest.status.replaceAll("_", " ")} · ${formatDate(latestRequest.createdAt)}` : "Belum ada pengajuan surat"} /></div> : null}</div></>;
}

function PropertyForm({ property, isPending, onSubmit }: { property: PropertyMapSummary; isPending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { const profile = property.profile; return <form onSubmit={onSubmit} className="grid gap-4"><div className="grid grid-cols-2 gap-3"><Field label="Gang"><select name="gang" defaultValue={property.gang}><option value="1">Gang 1</option><option value="2">Gang 2</option><option value="3">Gang 3</option><option value="5">Gang 5</option></select></Field><Field label="Nomor rumah"><input name="houseNumber" required defaultValue={property.houseNumber} inputMode="numeric" /></Field></div><Field label="Status hunian"><select name="occupancyStatus" defaultValue={property.occupancyStatus ?? ""}><option value="">Belum disahkan</option><option value="self">Dihuni sendiri</option><option value="relative">Dihuni kerabat</option><option value="tenant">Dihuni penyewa</option><option value="vacant_rent">Kosong, disewakan</option><option value="vacant_sale">Kosong, dijual</option></select></Field><Field label="Penanggung jawab"><input name="responsibleName" defaultValue={profile?.responsibleName ?? ""} /></Field><Field label="Alamat penanggung jawab"><textarea name="responsibleAddress" defaultValue={profile?.responsibleAddress ?? ""} /></Field><div className="grid grid-cols-2 gap-3"><Field label="WhatsApp"><input name="whatsapp" defaultValue={profile?.whatsapp ?? ""} inputMode="tel" /></Field><Field label="Email"><input name="contactEmail" type="email" defaultValue={profile?.contactEmail ?? ""} /></Field></div><Field label="Kepala keluarga"><input name="headOfHouseholdName" defaultValue={profile?.headOfHouseholdName ?? ""} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Pekerjaan"><select name="headOfHouseholdOccupation" defaultValue={profile?.headOfHouseholdOccupation ?? ""}><option value="">Pilih</option><option value="employee">Pegawai</option><option value="entrepreneur">Wiraswasta</option><option value="student">Pelajar</option></select></Field><Field label="Jumlah penghuni"><input name="occupantsCount" type="number" min="1" max="30" defaultValue={profile?.occupantsCount ?? ""} /></Field></div><button disabled={isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action disabled:opacity-60">{isPending ? <SpinnerGap size={18} className="animate-spin" /> : <CheckCircle size={18} weight="bold" />}{isPending ? "Menyimpan…" : "Simpan data rumah"}</button></form>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-xs font-extrabold text-ink [&>input]:min-h-11 [&>input]:rounded-xl [&>input]:border [&>input]:border-[#bfd2c9] [&>input]:bg-white [&>input]:px-3 [&>input]:text-sm [&>input]:font-semibold [&>select]:min-h-11 [&>select]:rounded-xl [&>select]:border [&>select]:border-[#bfd2c9] [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-semibold [&>textarea]:min-h-20 [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-[#bfd2c9] [&>textarea]:bg-white [&>textarea]:p-3 [&>textarea]:text-sm [&>textarea]:font-semibold"><span>{label}</span>{children}</label>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="border-b border-[#dce7e1] pb-3"><p className="text-xs font-extrabold uppercase tracking-[.1em] text-ink-faint">{label}</p><p className="mt-1 text-sm font-extrabold leading-6 text-ink">{value}</p></div>; }
