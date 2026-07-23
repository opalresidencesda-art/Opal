import { BookOpenText, Info } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { GuideHashScroll } from "@/components/guide-hash-scroll";
import { GuideSectionArticle } from "@/components/guide-section";
import { GuideSectionNav } from "@/components/guide-section-nav";
import { getPortalData } from "@/lib/data";

export const metadata = {
  title: "Panduan Harmonis",
  description: "Panduan bersama untuk warga OPAL Residence.",
};

export default async function PanduanHarmonisPage() {
  const data = await getPortalData();

  return (
    <>
      <GuideHashScroll />
      <section className="overflow-hidden bg-action text-ink-inverse">
        <div className="mx-auto grid max-w-[1440px] overflow-hidden sm:grid-cols-[0.92fr_1.08fr]">
          <div className="flex items-center px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
            <div className="max-w-2xl"><p className="flex items-center gap-2 text-[0.72rem] font-bold tracking-[0.14em] text-brand-soft"><BookOpenText size={18} weight="fill" aria-hidden="true" /> PANDUAN HARMONIS</p>
            <h1 className="public-display mt-5 text-4xl font-bold leading-[0.96] sm:text-5xl lg:text-6xl">Pedoman bertetangga yang selalu siap diakses.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-inverse/78 sm:text-lg">Versi web resmi panduan warga OPAL. Setiap aturan dapat dibagikan lewat tautan langsung dan diperbarui saat kebijakan lingkungan berubah.</p></div>
          </div>
          <div className="hero-image-drift relative min-h-[300px] sm:min-h-0">
            <Image src="/images/opal-neighborhood-hero.png" alt="Lingkungan OPAL Residence" fill priority sizes="(max-width: 640px) 100vw, 55vw" className="object-cover object-[62%_center]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,41,0.45),transparent_42%)]" aria-hidden="true" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <GuideSectionNav sections={data.guideSections} />
        <div className="min-w-0">
          <div className="mb-12 flex gap-3 border-l-2 border-brand px-5 py-1 text-sm leading-6 text-ink-muted">
            <Info className="mt-0.5 shrink-0 text-brand" size={20} weight="fill" aria-hidden="true" />
            <p>Nominal iuran di halaman ini adalah informasi aktif. Perubahan nominal akan diumumkan RT dan ditampilkan beserta tanggal berlakunya.</p>
          </div>
          <div className="max-w-3xl">
            {data.guideSections.map((section) => <GuideSectionArticle key={section.id ?? section.slug} section={section} fees={data.fees} />)}
          </div>
        </div>
      </div>
    </>
  );
}
