import { ArrowLeft, MapTrifold } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPropertyMap } from "@/components/admin-property-map";
import { getAdminContext } from "@/lib/admin";
import { type PropertyMapSummary } from "@/lib/opal-map-layout";
import { latestPropertyImagePaths, type PropertyImageRecord } from "@/lib/property-image-records";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Peta Rumah | Admin RT OPAL" };

type MapPropertyRow = {
  id: string;
  unit_code: string;
  gang: number;
  house_number: string;
  occupancy_status: string | null;
  active: boolean;
  access_token_created_at: string | null;
  access_token_revoked_at: string | null;
  resident_profiles: {
    responsible_name: string;
    responsible_address: string;
    whatsapp: string;
    head_of_household_name: string;
    head_of_household_occupation: string;
    occupants_count: number;
    contact_email: string;
    updated_at: string;
  } | { responsible_name: string; responsible_address: string; whatsapp: string; head_of_household_name: string; head_of_household_occupation: string; occupants_count: number; contact_email: string; updated_at: string }[] | null;
  resident_submissions: Array<{
    id: string;
    status: string;
    created_at: string;
    resident_evidence: Array<{ id: string; evidence_kind: string; original_name: string }>;
  }>;
  property_contributions: Array<{ status: "paid" | "pending" | "waived"; period: string | null; amount_rupiah: number; paid_at: string | null }>;
  service_requests: Array<{ id: string; request_type: "move" | "domicile" | "single"; status: string; created_at: string }>;
  property_map_positions: Array<{ latitude: number; longitude: number; calibrated_at: string; calibrated_by: string }>;
};

function first<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapProperty(row: MapPropertyRow, imagePath: string | null): PropertyMapSummary {
  const profile = first(row.resident_profiles);
  const latestSubmission = [...(row.resident_submissions ?? [])].sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
  return {
    id: row.id,
    unitCode: row.unit_code,
    gang: row.gang,
    houseNumber: row.house_number,
    occupancyStatus: row.occupancy_status,
    imagePath,
    active: row.active,
    accessLinkActive: Boolean(row.access_token_created_at && !row.access_token_revoked_at),
    position: first(row.property_map_positions) ? {
      latitude: first(row.property_map_positions)!.latitude,
      longitude: first(row.property_map_positions)!.longitude,
      calibratedAt: first(row.property_map_positions)!.calibrated_at,
      calibratedBy: first(row.property_map_positions)!.calibrated_by,
    } : null,
    profile: profile ? {
      responsibleName: profile.responsible_name,
      responsibleAddress: profile.responsible_address,
      whatsapp: profile.whatsapp,
      headOfHouseholdName: profile.head_of_household_name,
      headOfHouseholdOccupation: profile.head_of_household_occupation,
      occupantsCount: profile.occupants_count,
      contactEmail: profile.contact_email,
      updatedAt: profile.updated_at,
    } : null,
    latestSubmission: latestSubmission ? {
      id: latestSubmission.id,
      status: latestSubmission.status,
      createdAt: latestSubmission.created_at,
      evidence: (latestSubmission.resident_evidence ?? []).map((evidence) => ({ id: evidence.id, evidenceKind: evidence.evidence_kind, originalName: evidence.original_name })),
    } : null,
    contributions: (row.property_contributions ?? []).map((item) => ({ status: item.status, period: item.period, amountRupiah: item.amount_rupiah, paidAt: item.paid_at })),
    requests: (row.service_requests ?? []).map((item) => ({ id: item.id, requestType: item.request_type, status: item.status, createdAt: item.created_at })),
  };
}

type PropertyMapPageState =
  | { kind: "signed-out" }
  | { kind: "forbidden" }
  | { kind: "setup" }
  | { kind: "load-error" }
  | { kind: "ready"; properties: PropertyMapSummary[]; initialUnit?: string };

async function loadPropertyMapPage(searchParams: Promise<{ unit?: string | string[] }>): Promise<PropertyMapPageState> {
  try {
    const context = await getAdminContext();
    if (context.kind === "signed-out" || context.kind === "forbidden" || context.kind === "setup") {
      return { kind: context.kind };
    }

    const supabase = await createSupabaseServerClient();
    const [propertiesResult, imagesResult, params] = await Promise.all([
      supabase.from("properties").select("id,unit_code,gang,house_number,occupancy_status,active,access_token_created_at,access_token_revoked_at,resident_profiles(responsible_name,responsible_address,whatsapp,head_of_household_name,head_of_household_occupation,occupants_count,contact_email,updated_at),resident_submissions(id,status,created_at,resident_evidence(id,evidence_kind,original_name)),property_contributions(status,period,amount_rupiah,paid_at),service_requests(id,request_type,status,created_at),property_map_positions(latitude,longitude,calibrated_at,calibrated_by)").order("unit_code"),
      supabase.from("source_imports").select("id,source_name,notes,imported_at").like("source_name", "property-image:%").order("imported_at", { ascending: false }),
      searchParams,
    ]);
    if (propertiesResult.error || imagesResult.error) return { kind: "load-error" };
    const imagePaths = latestPropertyImagePaths((imagesResult.data ?? []) as PropertyImageRecord[]);
    const initialUnit = typeof params.unit === "string" ? params.unit : undefined;
    return {
      kind: "ready",
      properties: (propertiesResult.data ?? []).map((row) => mapProperty(row as MapPropertyRow, imagePaths.get(row.id) ?? null)),
      initialUnit,
    };
  } catch (error) {
    console.error("[peta-rumah] Server render failed:", error);
    return { kind: "load-error" };
  }
}

export default async function AdminPropertyMapPage({ searchParams }: { searchParams: Promise<{ unit?: string | string[] }> }) {
  const state = await loadPropertyMapPage(searchParams);
  if (state.kind === "signed-out") redirect("/admin/login");
  if (state.kind === "forbidden") redirect("/admin/login?reason=forbidden");
  if (state.kind === "setup") return <SetupState />;
  if (state.kind === "load-error") return <LoadError />;
  return <AdminPropertyMap properties={state.properties} initialUnit={state.initialUnit} />;
}

function SetupState() {
  return <main className="grid min-h-[100dvh] place-items-center bg-surface p-6"><section className="max-w-lg border border-line bg-surface-raised p-7"><MapTrifold size={30} weight="duotone" className="text-brand" /><h1 className="mt-5 text-2xl font-black tracking-[-0.05em] text-ink">Peta rumah menunggu konfigurasi</h1><p className="mt-3 text-sm leading-7 text-ink-muted">Hubungkan Supabase dan buat akun admin lebih dahulu. Peta tidak dapat memuat data warga tanpa konfigurasi yang aman.</p><Link href="/admin" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action"><ArrowLeft size={17} weight="bold" />Kembali ke admin</Link></section></main>;
}

function LoadError() {
  return <main className="grid min-h-[100dvh] place-items-center bg-surface p-6"><section className="max-w-lg border border-danger bg-surface-raised p-7"><h1 className="text-2xl font-black tracking-[-0.05em] text-ink">Peta belum dapat dimuat</h1><p className="mt-3 text-sm leading-7 text-ink-muted">Data rumah tidak dapat dibaca dari Supabase. Jangan menganggap peta kosong sebagai tidak ada data.</p><Link href="/admin" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action"><ArrowLeft size={17} weight="bold" />Kembali ke admin</Link></section></main>;
}
