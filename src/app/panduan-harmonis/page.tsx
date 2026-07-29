import Image from "next/image";
import { GuideSectionArticle } from "@/components/guide-section";
import { GuideSectionNav } from "@/components/guide-section-nav";
import { GuideTopicIndex } from "@/components/guide-topic-index";
import { PublicHashScroll } from "@/components/public-hash-scroll";
import { getPortalData } from "@/lib/data";

export const metadata = {
  title: "Panduan Harmonis",
  description: "Panduan bersama untuk warga OPAL Residence.",
};

export default async function PanduanHarmonisPage() {
  const data = await getPortalData();
  const hasSections = data.guideSections.length > 0;

  return (
    <>
      <PublicHashScroll />
      <section className="overflow-hidden bg-action text-ink-inverse">
        <div className="grid overflow-hidden sm:grid-cols-[0.92fr_1.08fr]">
          <div className="flex items-center px-5 py-14 sm:py-16 sm:pr-8 sm:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] lg:py-20 lg:pr-10 lg:pl-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]">
            <div className="max-w-2xl"><p className="public-kicker text-brand-highlight">Panduan harmonis</p>
            <h1 className="public-display mt-5 text-4xl font-bold leading-[0.96] sm:text-5xl lg:text-6xl">Cari aturan warga berdasarkan topik.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-inverse/78 sm:text-lg">Buka bagian yang dibutuhkan, bagikan tautannya, dan cek pembaruan dari RT.</p></div>
          </div>
          <div className="hero-image-drift relative min-h-[300px] overflow-hidden bg-action sm:min-h-0">
            <Image src="/images/opal-neighborhood-hero.png" alt="Lingkungan OPAL Residence" fill priority sizes="(max-width: 640px) 100vw, 55vw" className="object-cover object-[62%_center]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,42,36,0.96)_0%,rgba(3,42,36,0.7)_18%,rgba(3,42,36,0.26)_40%,transparent_58%)]" aria-hidden="true" />
          </div>
        </div>
      </section>

      <GuideTopicIndex sections={data.guideSections} />

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 pb-14 sm:px-8 sm:pb-20 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:pb-24">
        <GuideSectionNav sections={data.guideSections} />
        <div className="min-w-0">
          {hasSections ? (
            <>
              <div className="mb-12 max-w-3xl rounded-[1.15rem] border border-line bg-surface-subtle px-5 py-5 text-sm leading-6 text-ink-muted sm:px-6">
                <p>Nominal iuran di halaman ini hanya ditampilkan bila jadwal aktif sudah diterbitkan RT.</p>
              </div>
              <div className="max-w-[72rem]">
                {data.guideSections.map((section) => <GuideSectionArticle key={section.id ?? section.slug} section={section} fees={data.fees} />)}
              </div>
            </>
          ) : <p className="rounded-[1.15rem] border border-line bg-surface-raised px-5 py-8 text-sm leading-6 text-ink-muted sm:px-6">Panduan harmonis belum tersedia. RT akan menerbitkan topik dan detail aturan setelah kontennya diverifikasi.</p>}
        </div>
      </div>
    </>
  );
}
