import { ArrowRight, Bell, BookOpenText, ClipboardText, CurrencyCircleDollar, FileText, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { FeeList } from "@/components/fee-list";
import { getPortalData } from "@/lib/data";
import { formatDate } from "@/lib/format";

const quickLinks = [
  { href: "/pendataan-warga", title: "Isi pendataan warga", description: "Satu pengisian untuk satu rumah, dengan unggahan dokumen yang terlindungi.", icon: ClipboardText },
  { href: "/layanan", title: "Ajukan surat", description: "Pindah rumah, domisili, atau belum menikah melalui alur yang jelas.", icon: FileText },
  { href: "/kas", title: "Cek kas dan iuran", description: "Lihat iuran aktif, rekening Kas OPAL, dan pembukuan publik.", icon: CurrencyCircleDollar },
  { href: "/panduan-harmonis", title: "Baca panduan", description: "Parkir, renovasi, stiker kendaraan, dan aturan sampah.", icon: BookOpenText },
];

export default async function Home() {
  const data = await getPortalData();
  const announcement = data.announcements.find((item) => item.pinned) ?? data.announcements[0];

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[640px] lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex items-center px-5 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold tracking-[0.16em] text-brand">OPAL RESIDENCE, SIDOARJO</p>
              <h1 className="mt-5 max-w-xl text-[2.8rem] font-bold tracking-[-0.065em] text-ink sm:text-6xl lg:text-[4.75rem] lg:leading-[0.98]"><span className="block">Urusan warga,</span><span className="block">lebih mudah.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">Panduan, iuran, surat, dan pendataan warga tersedia dalam satu portal yang jelas dan aman.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/layanan" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-action px-6 text-base font-bold text-on-action hover:bg-brand">
                  Pilih layanan warga <ArrowRight size={18} weight="bold" aria-hidden="true" />
                </Link>
                <Link href="/panduan-harmonis" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-line bg-surface-raised px-6 text-base font-bold text-ink hover:border-brand hover:text-brand">
                  Baca panduan
                </Link>
              </div>
            </div>
          </div>
          <div className="relative min-h-[260px] overflow-hidden border-t border-line sm:min-h-[400px] lg:min-h-0 lg:border-t-0 lg:border-l">
            <Image src="/images/opal-neighborhood-hero.png" alt="Jalan lingkungan OPAL Residence" fill priority sizes="(max-width: 1024px) 100vw, 56vw" className="object-cover object-[63%_center]" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 py-12 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div><FeeList fees={data.fees} /></div>
          <article className="border-t border-line pt-12 lg:border-t-0 lg:pt-0">
            <div className="flex items-center gap-3 text-brand"><Bell size={21} weight="fill" aria-hidden="true" /><p className="text-sm font-bold">Pengumuman warga</p></div>
            {announcement ? <><h2 className="mt-8 max-w-lg text-balance text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">{announcement.title}</h2><p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">{announcement.body}</p><p className="mt-8 text-sm font-semibold text-ink-faint">Diperbarui {formatDate(announcement.publishedAt)}</p></> : <p className="mt-7 max-w-lg text-base leading-7 text-ink-muted">Belum ada pengumuman yang dipublikasikan.</p>}
          </article>
        </div>
      </section>

      <section className="border-y border-line bg-surface-subtle">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="order-2 relative min-h-[240px] overflow-hidden border-t border-line sm:min-h-[330px] lg:order-1 lg:min-h-[520px] lg:border-r lg:border-t-0">
            <Image src="/images/opal-arrival-evening.png" alt="Akses masuk lingkungan OPAL Residence" fill sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover object-[68%_center]" />
          </div>
          <div className="order-1 px-5 py-12 sm:px-8 lg:order-2 lg:px-10 lg:py-16">
            <h2 className="max-w-lg text-balance text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Pilih kebutuhan Anda.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">Setiap layanan dibuka lewat satu jalur yang jelas, tanpa perlu mencari dokumen lama.</p>
            <div className="mt-10 divide-y divide-line border-t border-line">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return <Link key={item.href} href={item.href} className="group grid min-h-[5.5rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 py-5 first:pt-5 sm:grid-cols-[3rem_1fr_auto] sm:gap-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-deep"><Icon size={22} weight="fill" aria-hidden="true" /></span>
                  <span><span className="block text-base font-bold tracking-[-0.035em] text-ink group-hover:text-brand sm:text-lg">{item.title}</span><span className="mt-1 block text-sm leading-6 text-ink-muted sm:text-[0.95rem]">{item.description}</span></span>
                  <ArrowRight className="shrink-0 text-brand transition-transform group-hover:translate-x-1" size={20} weight="bold" aria-hidden="true" />
                </Link>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-10 lg:py-20">
        <div>
          <h2 className="max-w-md text-balance text-3xl font-bold tracking-[-0.055em] text-ink sm:text-4xl">Panduan Harmonis, kini benar-benar hidup.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">Aturan bersama dapat dibaca per topik, dibagikan lewat tautan langsung, dan diperbarui saat diperlukan.</p>
          <Link href="/panduan-harmonis" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-raised px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand">Jelajahi panduan <ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
        </div>
        <div className="border-t border-line">
          {data.guideSections.map((section) => <Link key={section.slug} href={`/panduan-harmonis#${section.slug}`} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-line py-5 sm:py-6"><span><span className="block text-lg font-bold tracking-[-0.035em] text-ink group-hover:text-brand">{section.title}</span><span className="mt-1.5 block max-w-xl text-sm leading-6 text-ink-muted">{section.summary}</span></span><ArrowRight className="mt-1 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" size={19} weight="bold" aria-hidden="true" /></Link>)}
        </div>
      </section>

      <section className="border-y border-line bg-brand-soft">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 sm:px-8 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex max-w-2xl items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-brand-deep" size={24} weight="fill" aria-hidden="true" /><div><h2 className="text-xl font-bold tracking-[-0.04em] text-ink">Informasi tetap berada di tangan pengurus.</h2><p className="mt-1.5 text-sm leading-6 text-ink-muted">Iuran, panduan, pengumuman, dan layanan dapat dikelola RT tanpa mengubah kode situs.</p></div></div>
          <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-action px-5 text-sm font-bold text-on-action hover:bg-brand">Masuk admin RT</Link>
        </div>
      </section>
    </>
  );
}
