"use client";

import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { createProperty, revokePropertyLink, rotatePropertyLink } from "@/app/admin/actions";

type Submission = { status: string; created_at: string };
type Contribution = { status: "paid" | "pending" | "waived"; period: string | null };
type Profile = { responsible_name: string; updated_at: string };
type PropertyLink = {
  id: string;
  unit_code: string;
  occupancy_status: string | null;
  access_token_created_at: string | null;
  access_token_revoked_at: string | null;
  resident_profiles: Profile | Profile[] | null;
  resident_submissions: Submission[];
  property_contributions: Contribution[];
};

type Filter = "all" | "attention" | "active" | "none" | "revoked";

const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "attention", label: "Perlu perhatian" },
  { id: "active", label: "Tautan aktif" },
  { id: "none", label: "Belum ada tautan" },
  { id: "revoked", label: "Dicabut" },
];

const occupancyLabels: Record<string, string> = {
  self: "Dihuni sendiri",
  relative: "Dihuni kerabat",
  tenant: "Dihuni penyewa",
  vacant_rent: "Kosong, disewakan",
  vacant_sale: "Kosong, dijual",
};

function latest<T extends { created_at?: string; period?: string | null }>(items: T[]) {
  return [...items].sort((left, right) => String(right.created_at ?? right.period ?? "").localeCompare(String(left.created_at ?? left.period ?? "")))[0];
}

function linkState(property: PropertyLink): Exclude<Filter, "all" | "attention"> {
  if (property.access_token_created_at && !property.access_token_revoked_at) return "active";
  if (property.access_token_created_at) return "revoked";
  return "none";
}

function dataState(property: PropertyLink) {
  const profile = Array.isArray(property.resident_profiles) ? property.resident_profiles[0] : property.resident_profiles;
  const submission = latest(property.resident_submissions);
  if (submission?.status === "uploading") return { label: "Unggahan belum selesai", tone: "muted" as const, detail: "Belum masuk ke antrean RT" };
  if (submission?.status === "needs_revision") return { label: "Data perlu revisi", tone: "alert" as const, detail: "Menunggu perbaikan warga" };
  if (submission && ["submitted", "in_review"].includes(submission.status)) return { label: "Data perlu diperiksa", tone: "alert" as const, detail: "Pendataan masuk" };
  if (profile) return { label: "Data disahkan", tone: "good" as const, detail: profile.responsible_name };
  if (submission?.status === "rejected") return { label: "Data ditolak", tone: "muted" as const, detail: "Belum ada data sah" };
  return { label: "Belum ada data", tone: "muted" as const, detail: "Warga belum mengisi pendataan" };
}

function contributionState(property: PropertyLink) {
  const pending = property.property_contributions.some((item) => item.status === "pending");
  const latestContribution = latest(property.property_contributions);
  if (pending) return { label: "Iuran perlu dicek", tone: "alert" as const };
  if (latestContribution?.status === "paid") return { label: "Iuran tercatat", tone: "good" as const };
  if (latestContribution?.status === "waived") return { label: "Iuran dibebaskan", tone: "muted" as const };
  return { label: "Belum ada iuran", tone: "muted" as const };
}

function needsAttention(property: PropertyLink) {
  return dataState(property).tone === "alert" || contributionState(property).tone === "alert";
}

function Pill({ label, tone }: { label: string; tone: "good" | "alert" | "muted" }) {
  const className = tone === "good" ? "bg-brand-soft text-brand-deep" : tone === "alert" ? "bg-warm text-ink" : "bg-surface-subtle text-ink-muted";
  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-extrabold ${className}`}>{label}</span>;
}

export function AdminPropertyDirectory({ properties }: { properties: PropertyLink[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const visibleProperties = useMemo(() => properties.filter((property) => {
    const matchesQuery = property.unit_code.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" || (filter === "attention" ? needsAttention(property) : linkState(property) === filter);
    return matchesQuery && matchesFilter;
  }), [filter, properties, query]);

  return <div>
    <details className="border-y border-line py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden"><div><p className="font-extrabold text-ink">Tambah rumah</p><p className="mt-1 text-sm leading-6 text-ink-muted">Buat unit lebih dahulu bila RT ingin menyiapkan tautan privat sebelum pendataan warga masuk.</p></div><Plus size={20} weight="bold" className="shrink-0 text-brand" aria-hidden="true" /></summary><form action={createProperty} className="mt-5 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-end"><label className="block text-sm font-extrabold text-ink">Gang<select name="gang" defaultValue="1" className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"><option value="1">Gang 1</option><option value="2">Gang 2</option><option value="3">Gang 3</option><option value="5">Gang 5</option></select></label><label className="block text-sm font-extrabold text-ink">Nomor rumah<input name="houseNumber" placeholder="Contoh: 62" required className="mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/15" /></label><button className="min-h-11 rounded-full bg-action px-5 text-sm font-bold text-on-action transition hover:bg-brand hover:text-on-brand">Tambah</button></form></details>
    <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label className="block text-sm font-extrabold text-ink"><span className="block">Cari unit rumah</span><span className="relative mt-2 block"><MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={19} weight="bold" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Contoh: OP 2 - 62" className="min-h-11 w-full rounded-xl border border-line bg-surface px-4 pl-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/15" /></span></label>
      <div className="flex gap-1 overflow-x-auto pb-0.5" aria-label="Filter rumah">{filters.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={`min-h-11 shrink-0 rounded-full px-3.5 text-sm font-bold transition ${filter === item.id ? "bg-action text-on-action" : "border border-line text-ink-muted hover:border-brand hover:text-brand-deep"}`}>{item.label}</button>)}</div>
    </div>
    <p className="mt-4 text-sm text-ink-muted" aria-live="polite">Menampilkan {visibleProperties.length} dari {properties.length} rumah.</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleProperties.map((property) => <PropertyLinkRow key={property.id} property={property} />)}{!visibleProperties.length ? <p className="border border-dashed border-line px-4 py-5 text-sm leading-6 text-ink-muted">Tidak ada rumah yang cocok dengan pencarian ini.</p> : null}</div>
  </div>;
}

function PropertyLinkRow({ property }: { property: PropertyLink }) {
  const state = linkState(property);
  const data = dataState(property);
  const contribution = contributionState(property);
  const linkLabel = state === "active" ? "Tautan aktif" : state === "revoked" ? "Tautan dicabut" : "Belum ada tautan";
  return <article className="border border-line bg-surface-raised p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-ink">{property.unit_code}</p><p className="mt-1 text-sm text-ink-muted">{property.occupancy_status ? occupancyLabels[property.occupancy_status] : "Status hunian belum disahkan"}</p></div><Pill label={linkLabel} tone={state === "active" ? "good" : "muted"} /></div><div className="mt-4 flex flex-wrap gap-2"><Pill label={data.label} tone={data.tone} /><Pill label={contribution.label} tone={contribution.tone} /></div><p className="mt-3 text-sm leading-6 text-ink-muted">{data.detail}</p><div className="mt-4 flex flex-wrap gap-2"><form action={rotatePropertyLink}><input type="hidden" name="id" value={property.id} /><button className="min-h-10 rounded-full bg-action px-3.5 text-xs font-bold text-on-action hover:bg-brand hover:text-on-brand">{state === "active" ? "Putar tautan" : "Buat tautan"}</button></form>{state === "active" ? <form action={revokePropertyLink}><input type="hidden" name="id" value={property.id} /><button className="min-h-10 rounded-full border border-line px-3.5 text-xs font-bold text-ink hover:border-danger hover:text-danger">Cabut</button></form> : null}</div></article>;
}
