import type { PortalData } from "@/lib/content";
import { quickAccessCategories } from "@/lib/quick-access";

export type HomeSearchKind = "Layanan" | "Panduan" | "Iuran" | "Pengumuman";

export type HomeSearchItem = {
  id: string;
  kind: HomeSearchKind;
  title: string;
  description: string;
  href: string;
  external?: boolean;
};

export function normaliseHomeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueItems(items: HomeSearchItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normaliseHomeSearchText(item.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildHomeSearchIndex(data: PortalData): HomeSearchItem[] {
  const residentServices = quickAccessCategories.flatMap((category) => category.items.map((item) => ({
    id: `service-${category.id}-${item.href}`,
    kind: "Layanan" as const,
    title: item.title,
    description: item.description,
    href: item.href,
  })));

  const guides = data.guideSections.map((section) => ({
    id: `guide-${section.id ?? section.slug}`,
    kind: "Panduan" as const,
    title: section.title,
    description: section.summary,
    href: `/panduan-harmonis#${section.slug}`,
  }));

  const fees = data.fees.map((fee) => ({
    id: `fee-${fee.id ?? fee.label}`,
    kind: "Iuran" as const,
    title: fee.label,
    description: `${fee.description} ${fee.paymentMethod}.`,
    href: "#iuran",
  }));

  const announcements = data.announcements.map((announcement) => ({
    id: `announcement-${announcement.id ?? announcement.title}`,
    kind: "Pengumuman" as const,
    title: announcement.title,
    description: announcement.body,
    href: "#pengumuman",
  }));

  const publishedResources = data.resources.map((resource) => ({
    id: `resource-${resource.id ?? resource.href}`,
    kind: "Layanan" as const,
    title: resource.title,
    description: resource.requiresGoogleLogin ? `${resource.description} Perlu login Google.` : resource.description,
    href: resource.href,
    external: /^https?:\/\//.test(resource.href),
  }));

  return uniqueItems([...residentServices, ...guides, ...fees, ...announcements, ...publishedResources]);
}

function scoreItem(item: HomeSearchItem, query: string) {
  const title = normaliseHomeSearchText(item.title);
  const description = normaliseHomeSearchText(item.description);
  const terms = query.split(" ").filter(Boolean);
  const haystack = `${title} ${description}`;

  if (!terms.length || !terms.every((term) => haystack.includes(term))) return -1;

  const titleMatches = terms.filter((term) => title.includes(term)).length;
  const descriptionMatches = terms.filter((term) => description.includes(term)).length;
  const phraseBonus = title === query ? 400 : title.startsWith(query) ? 300 : title.includes(query) ? 200 : description.includes(query) ? 100 : 0;

  return phraseBonus + titleMatches * 20 + descriptionMatches * 4;
}

export function searchHomeContent(index: HomeSearchItem[], rawQuery: string, limit = 6) {
  const query = normaliseHomeSearchText(rawQuery);
  if (!query) return [];

  return index
    .map((item, order) => ({ item, order, score: scoreItem(item, query) }))
    .filter((match) => match.score >= 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((match) => match.item);
}
