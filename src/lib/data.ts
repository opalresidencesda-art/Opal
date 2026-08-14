import { createClient } from "@supabase/supabase-js";
import {
  sortGuideSections,
  type Announcement,
  type FeeSchedule,
  type GuideSection,
  type PortalData,
  type Resource,
} from "@/lib/content";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

type DatabaseFee = {
  id: string;
  label: string;
  amount_rupiah: number;
  payment_method: string;
  destination: string;
  description: string;
  effective_from: string;
  is_active: boolean;
};

type DatabaseAnnouncement = {
  id: string;
  title: string;
  body: string;
  published_at: string;
  pinned: boolean;
  image_path: string | null;
  image_alt: string;
};

type DatabaseResource = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: Resource["category"];
  requires_google_login: boolean;
};

type DatabaseGuideSection = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_markdown: string;
  sort_order: number;
};

function publicClient() {
  if (!isSupabaseConfigured() || !supabaseUrl || !supabasePublishableKey) return null;
  return createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false } });
}

function mapFee(fee: DatabaseFee): FeeSchedule {
  return {
    id: fee.id,
    label: fee.label,
    amountRupiah: fee.amount_rupiah,
    paymentMethod: fee.payment_method,
    destination: fee.destination,
    description: fee.description,
    effectiveFrom: fee.effective_from,
    active: fee.is_active,
  };
}

function mapAnnouncement(item: DatabaseAnnouncement): Announcement {
  const localFallbackImage = !item.image_path && item.title === "81 TAHUN KEMERDEKAAN RI"
    ? "/images/announcements/17-agustus-2026.webp"
    : null;
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    publishedAt: item.published_at,
    pinned: item.pinned,
    imagePath: item.image_path,
    imageAlt: item.image_alt,
    imageUrl: localFallbackImage,
  };
}

function mapResource(item: DatabaseResource): Resource {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    category: item.category,
    requiresGoogleLogin: item.requires_google_login,
  };
}

function mapGuideSection(item: DatabaseGuideSection): GuideSection {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    bodyMarkdown: item.body_markdown,
    sortOrder: item.sort_order,
  };
}

export async function getPortalData(): Promise<PortalData> {
  const supabase = publicClient();
  if (!supabase) return { fees: [], announcements: [], resources: [], guideSections: [] };

  const [feesResult, announcementsResult, resourcesResult, sectionsResult] = await Promise.all([
    supabase.from("fee_schedules").select("*").eq("is_active", true).order("effective_from", { ascending: false }),
    supabase.from("announcements").select("*").eq("published", true).order("pinned", { ascending: false }).order("published_at", { ascending: false }),
    supabase.from("resources").select("*").eq("published", true).order("sort_order"),
    supabase.from("guide_sections").select("*").eq("published", true).order("sort_order"),
  ]);

  return {
    fees: feesResult.error ? [] : (feesResult.data as DatabaseFee[]).map(mapFee),
    announcements: announcementsResult.error ? [] : (announcementsResult.data as DatabaseAnnouncement[]).map(mapAnnouncement),
    resources: resourcesResult.error ? [] : (resourcesResult.data as DatabaseResource[]).map(mapResource),
    guideSections: sectionsResult.error ? [] : sortGuideSections((sectionsResult.data as DatabaseGuideSection[]).map(mapGuideSection)),
  };
}

export async function getPublishedAnnouncement(id: string): Promise<Announcement | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("announcements").select("*").eq("id", id).eq("published", true).maybeSingle();
  if (error || !data) return null;
  return mapAnnouncement(data as DatabaseAnnouncement);
}
