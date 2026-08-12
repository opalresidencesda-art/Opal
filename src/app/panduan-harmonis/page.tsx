import { GuideReadingShell } from "@/components/guide-reading-shell";
import { GuideSectionArticle } from "@/components/guide-section";
import { GuideTopicIndex } from "@/components/guide-topic-index";
import { PublicHashScroll } from "@/components/public-hash-scroll";
import { getPortalData } from "@/lib/data";

export const metadata = {
  title: "Panduan Harmonis",
  description: "Panduan bersama untuk warga OPAL Residence.",
};

export default async function PanduanHarmonisPage() {
  const data = await getPortalData();

  return (
    <>
      <PublicHashScroll />
      {data.guideSections.length ? (
        <GuideReadingShell sections={data.guideSections}>
          {data.guideSections.map((section, index) => (
            <GuideSectionArticle key={section.id ?? section.slug} section={section} fees={data.fees} index={index} />
          ))}
        </GuideReadingShell>
      ) : <GuideTopicIndex sections={data.guideSections} />}
    </>
  );
}
