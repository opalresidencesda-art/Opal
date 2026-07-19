import { BookOpenText, Info } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { GuideHashScroll } from "@/components/guide-hash-scroll";
import { GuideSectionArticle } from "@/components/guide-section";
import { GuideSectionNav } from "@/components/guide-section-nav";
import { Reveal } from "@/components/reveal";
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
      <section className="border-b border-line bg-surface-subtle">
        <div className="mx-auto grid max-w-[1440px] overflow-hidden sm:grid-cols-[1.05fr_0.95fr]">
          <Reveal className="px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand"><BookOpenText size={19} weight="fill" aria-hidden="true" /> Panduan harmonis</p>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl lg:text-6xl lg:leading-[0.95]">Pedoman bertetangga yang selalu siap diakses.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted sm:text-lg">Versi web resmi panduan warga OPAL. Setiap aturan dapat dibagikan lewat tautan langsung, dibaca dengan nyaman, dan diperbarui saat kebijakan lingkungan berubah.</p>
          </Reveal>
          <div className="relative min-h-64 border-t border-line sm:min-h-0 sm:border-l sm:border-t-0">
            <Image src="/images/opal-neighborhood-hero.png" alt="Lingkungan OPAL Residence" fill priority sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16 lg:px-10 lg:py-16">
        <GuideSectionNav sections={data.guideSections} />
        <main className="min-w-0">
          <Reveal className="mb-10 flex gap-3 border-l-2 border-brand bg-surface-subtle px-5 py-4 text-sm leading-6 text-ink-muted">
            <Info className="mt-0.5 shrink-0 text-brand" size={20} weight="fill" aria-hidden="true" />
            <p>Nominal iuran di halaman ini adalah informasi aktif. Perubahan nominal akan diumumkan RT dan ditampilkan beserta tanggal berlakunya.</p>
          </Reveal>
          <div className="max-w-3xl">
            {data.guideSections.map((section, index) => <GuideSectionArticle key={section.id ?? section.slug} section={section} fees={data.fees} index={index + 1} />)}
          </div>
        </main>
      </div>
    </>
  );
}
