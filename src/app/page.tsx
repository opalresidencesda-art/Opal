import { ArrowRight, Bell, BookOpenText, ClipboardText, CurrencyCircleDollar, FileText, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { FeeList } from "@/components/fee-list";
import { PublicReveal } from "@/components/public-reveal";
import { getPortalData } from "@/lib/data";
import { formatDate } from "@/lib/format";

const quickLinks = [
  { href: "/pendataan-warga", title: "Pendataan warga", description: "Satu pengisian untuk satu rumah, dengan unggahan dokumen yang terlindungi.", icon: ClipboardText },
  { href: "/layanan", title: "Ajukan surat", description: "Pindah rumah, domisili, atau belum menikah melalui alur yang jelas.", icon: FileText },
  { href: "/kas", title: "Kas dan iuran", description: "Lihat iuran aktif, rekening Kas OPAL, dan pembukuan publik.", icon: CurrencyCircleDollar },
  { href: "/panduan-harmonis", title: "Panduan harmonis", description: "Aturan parkir, renovasi, stiker kendaraan, dan sampah.", icon: BookOpenText },
];

export default async function Home() {
  const data = await getPortalData();
  const announcement = data.announcements.find((item) => item.pinned) ?? data.announcements[0];

  return (
    <>
      <section className="overflow-hidden bg-action text-ink-inverse">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[650px] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="relative z-10 flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-16">
            <div className="max-w-xl">
              <p className="text-xs font-extrabold tracking-[0.16em] text-brand-soft">OPAL RESIDENCE, SIDOARJO</p>
              <h1 className="public-display mt-6 text-[3.35rem] font-bold leading-[0.94] sm:text-6xl lg:text-[5.25rem]">Satu pintu untuk urusan warga.</h1>
              <p className="mt-7 max-w-lg text-base leading-7 text-ink-inverse/78 sm:text-lg">Panduan, iuran, surat, dan pendataan lingkungan tersedia dalam satu portal yang jelas.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/layanan" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-surface-raised px-6 text-base font-bold text-action shadow-[0_18px_48px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:bg-brand-soft">
                  Pilih layanan <ArrowRight size={18} weight="bold" aria-hidden="true" />
                </Link>
                <Link href="/panduan-harmonis" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/25 px-6 text-base font-bold text-ink-inverse transition hover:-translate-y-1 hover:border-brand-soft hover:bg-white/10">
                  Baca panduan
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-image-drift relative min-h-[330px] overflow-hidden lg:min-h-0">
            <Image src="/images/opal-neighborhood-hero.png" alt="Jalan lingkungan OPAL Residence" fill priority sizes="(max-width: 1024px) 100vw, 59vw" className="object-cover object-[61%_center]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,41,0.5),transparent_45%)] lg:bg-[linear-gradient(90deg,rgba(11,48,41,0.44),transparent_35%)]" aria-hidden="true" />
          </div>
        </div>
      </section>

      <PublicReveal><section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:px-10 lg:py-20">
        <div className="self-start">
          <p className="public-kicker">Portal lingkungan</p>
          <h2 className="public-display mt-4 max-w-md text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Informasi penting tidak lagi tersimpan di banyak dokumen.</h2>
          <div className="public-rule mt-7" />
        </div>
        <article className="border-l-2 border-brand pl-5 sm:pl-7">
          <div className="flex items-center gap-2 text-sm font-bold text-brand"><Bell size={19} weight="fill" aria-hidden="true" /> Pengumuman warga</div>
          {announcement ? <><h2 className="public-display mt-5 max-w-2xl text-2xl font-bold leading-[1.05] text-ink sm:text-3xl">{announcement.title}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">{announcement.body}</p><p className="mt-6 text-sm font-semibold text-ink-faint">Diperbarui {formatDate(announcement.publishedAt)}</p></> : <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">Belum ada pengumuman yang dipublikasikan.</p>}
        </article>
      </section></PublicReveal>

      <PublicReveal><section className="bg-surface-subtle">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20 lg:px-10 lg:py-20">
          <div>
            <p className="public-kicker">Iuran aktif</p>
            <h2 className="public-display mt-4 max-w-md text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Per rumah, per bulan.</h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-ink-muted">Nominal dan cara pembayaran selalu mengacu pada informasi yang sedang berlaku.</p>
            <Link href="/kas" className="mt-8 inline-flex min-h-11 items-center gap-2 text-base font-bold text-brand-deep transition hover:gap-3 hover:text-brand">Lihat transparansi kas <ArrowRight size={17} weight="bold" aria-hidden="true" /></Link>
          </div>
          <div className="border-t border-line pt-8 lg:pt-0"><FeeList fees={data.fees} /></div>
        </div>
      </section></PublicReveal>

      <PublicReveal><section className="mx-auto grid max-w-[1440px] lg:grid-cols-[0.94fr_1.06fr]">
        <div className="relative min-h-[300px] overflow-hidden sm:min-h-[390px] lg:min-h-[620px]">
          <Image src="/images/opal-arrival-evening.png" alt="Akses masuk lingkungan OPAL Residence pada malam hari" fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover object-center" />
        </div>
        <div className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <p className="public-kicker">Layanan warga</p>
          <h2 className="public-display mt-4 max-w-lg text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Mulai dari kebutuhan yang paling dekat.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">Setiap layanan memiliki jalur yang jelas, mulai dari pengisian data sampai tindak lanjut pengurus.</p>
          <div className="mt-10 border-t border-line">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className="public-row-link group grid min-h-[6.5rem] grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-5 pl-4 transition sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-5 sm:pl-5">
                <Icon className="text-brand" size={26} weight="fill" aria-hidden="true" />
                <span className="min-w-0"><span className="block text-lg font-bold tracking-[-0.04em] text-ink transition group-hover:text-brand">{item.title}</span><span className="mt-1 block text-sm leading-6 text-ink-muted">{item.description}</span></span>
                <ArrowRight className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" size={20} weight="bold" aria-hidden="true" />
              </Link>;
            })}
          </div>
        </div>
      </section></PublicReveal>

      <PublicReveal><section className="border-y border-line bg-surface-raised">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:px-10 lg:py-20">
          <div>
            <p className="public-kicker">Panduan harmonis</p>
            <h2 className="public-display mt-4 max-w-md text-3xl font-bold leading-[1.02] text-ink sm:text-4xl">Aturan bersama, dalam bahasa yang mudah ditemukan.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">Buka satu topik, salin tautannya, lalu bagikan tanpa mencari PDF lama.</p>
            <Link href="/panduan-harmonis" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-action px-5 text-sm font-bold text-on-action transition hover:-translate-y-1 hover:bg-brand">Jelajahi panduan <ArrowRight size={16} weight="bold" aria-hidden="true" /></Link>
          </div>
          <div className="border-t border-line">
            {data.guideSections.map((section) => <Link key={section.slug} href={`/panduan-harmonis#${section.slug}`} className="public-row-link group grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-line py-6 pl-4 transition sm:pl-5"><span><span className="block text-xl font-bold tracking-[-0.04em] text-ink transition group-hover:text-brand">{section.title}</span><span className="mt-2 block max-w-xl text-sm leading-6 text-ink-muted">{section.summary}</span></span><ArrowRight className="mt-1 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" size={20} weight="bold" aria-hidden="true" /></Link>)}
          </div>
        </div>
      </section></PublicReveal>

      <section className="bg-brand">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-12 text-on-brand sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-14">
          <div className="flex max-w-2xl items-start gap-4"><ShieldCheck className="mt-0.5 shrink-0 text-brand-soft" size={27} weight="fill" aria-hidden="true" /><div><h2 className="public-display text-2xl font-bold leading-[1.06]">Informasi lingkungan dikelola oleh RT.</h2><p className="mt-2 text-base leading-7 text-on-brand/80">Pengumuman, panduan, iuran, dan layanan dapat diperbarui tanpa mengubah halaman warga.</p></div></div>
          <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-surface-raised px-5 text-sm font-bold text-action transition hover:-translate-y-1 hover:bg-brand-soft">Masuk admin RT</Link>
        </div>
      </section>
    </>
  );
}
