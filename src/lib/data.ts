import { createClient } from "@supabase/supabase-js";
import {
  defaultPortalData,
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
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    publishedAt: item.published_at,
    pinned: item.pinned,
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
  if (!supabase) return defaultPortalData;

  const [feesResult, announcementsResult, resourcesResult, sectionsResult] = await Promise.all([
    supabase.from("fee_schedules").select("*").eq("is_active", true).order("effective_from", { ascending: false }),
    supabase.from("announcements").select("*").eq("published", true).order("pinned", { ascending: false }).order("published_at", { ascending: false }),
    supabase.from("resources").select("*").eq("published", true).order("sort_order"),
    supabase.from("guide_sections").select("*").eq("published", true).order("sort_order"),
  ]);

  if (feesResult.error || announcementsResult.error || resourcesResult.error || sectionsResult.error) {
    return defaultPortalData;
  }

  return {
    fees: feesResult.data.length ? (feesResult.data as DatabaseFee[]).map(mapFee) : defaultPortalData.fees,
    announcements: announcementsResult.data.length
      ? (announcementsResult.data as DatabaseAnnouncement[]).map(mapAnnouncement)
      : defaultPortalData.announcements,
    resources: resourcesResult.data.length
      ? (resourcesResult.data as DatabaseResource[]).map(mapResource)
      : defaultPortalData.resources,
    guideSections: sectionsResult.data.length
      ? sortGuideSections((sectionsResult.data as DatabaseGuideSection[]).map(mapGuideSection))
      : defaultPortalData.guideSections,
  };
}
