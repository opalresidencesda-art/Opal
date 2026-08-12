import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPortalData } from "@/lib/data";

type GuideDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function getGuideSection(slug: string) {
  const data = await getPortalData();
  return { data, section: data.guideSections.find((item) => item.slug === slug) };
}

export async function generateMetadata({ params }: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { section } = await getGuideSection(slug);
  if (!section) return {};

  return { title: section.title, description: section.summary };
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const { section } = await getGuideSection(slug);
  if (!section) notFound();

  redirect(`/panduan-harmonis#${section.slug}`);
}
