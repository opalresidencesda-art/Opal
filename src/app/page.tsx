import { ArrowRight, Bell, BookOpenText, ClipboardText, CurrencyCircleDollar, MapPin, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { FeeList } from "@/components/fee-list";
import { Reveal } from "@/components/reveal";
import { getPortalData } from "@/lib/data";
import { formatDate } from "@/lib/format";

const quickLinks = [
  { href: "/panduan-harmonis", title: "Panduan harmonis", description: "Aturan bersama yang siap dibaca dari ponsel.", icon: BookOpenText },
  { href: "/layanan", title: "Layanan warga", description: "Surat, formulir, denah, dan dokumen OPAL.", icon: ClipboardText },
  { href: "/kas", title: "Kas dan iuran", description: "Ringkasan pembukuan publik dan panduan pembayaran.", icon: CurrencyCircleDollar },
];

export default async function Home() {
  const data = await getPortalData();
  const announcement = data.announcements.find((item) => item.pinned) ?? data.announcements[0];

  return (
    <>
      <section className="relative isolate min-h-[570px] overflow-hidden bg-[#071815] sm:min-h-[620px]">
        <Image
          src="/images/opal-arrival-evening.png"
          alt="Jalur masuk dalam lingkungan OPAL Residence saat sore hari"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[#061613]/[0.67]" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[570px] max-w-[1440px] items-end px-5 py-14 sm:min-h-[620px] sm:px-8 sm:py-18 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.18em] text-[#9fe6da]">OPAL RESIDENCE · SIDOARJO</p>
            <h1 className="mt-5 text-balance text-5xl font-extrabold tracking-[-0.07em] text-ink-inverse sm:text-6xl lg:text-[5.3rem] lg:leading-[0.93]">
              Hidup bertetangga, dengan standar yang lebih baik.
            </h1>
            <p className="mt-6 max-w-xl text-[1.02rem] leading-7 text-[#cfe0dc] sm:text-lg">
              Satu portal untuk informasi, layanan, dan aturan bersama warga OPAL. Jelas ketika dibutuhkan, mudah diperbarui ketika keadaan berubah.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/panduan-harmonis" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e4f1ed] px-6 text-sm font-bold text-[#0a2924] hover:-translate-y-0.5 hover:bg-[#bce7df] active:translate-y-0">
                Baca panduan warga <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </Link>
              <Link href="/layanan" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d3ebe4]/55 px-6 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:border-[#d3ebe4] hover:bg-[#d3ebe4]/10 active:translate-y-0">
                Temukan layanan
              </Link>
            </div>
            <p className="mt-10 flex items-start gap-2 text-sm leading-6 text-[#b6ccc6]">
              <MapPin size={18} weight="fill" className="mt-0.5 shrink-0 text-[#9fe6da]" aria-hidden="true" />
              Kluster OPAL, Waru, Sidoarjo
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="grid border-x border-line lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="px-5 py-11 sm:px-8 lg:border-r lg:px-10 lg:py-14">
            <FeeList fees={data.fees} />
          </Reveal>
          <Reveal delay={0.08} className="border-t border-line bg-surface-subtle px-5 py-11 sm:px-8 lg:border-t-0 lg:px-10 lg:py-14">
            <div className="flex items-center gap-3 text-brand">
              <Bell size={22} weight="fill" aria-hidden="true" />
              <p className="text-sm font-bold">Pengumuman warga</p>
            </div>
            {announcement ? (
              <>
                <h2 className="mt-8 max-w-lg text-balance text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">{announcement.title}</h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted">{announcement.body}</p>
                <p className="mt-8 border-t border-line pt-4 text-sm font-medium text-ink-faint">Diperbarui {formatDate(announcement.publishedAt)}</p>
              </>
            ) : (
              <p className="mt-7 max-w-lg text-base leading-7 text-ink-muted">Belum ada pengumuman yang dipublikasikan.</p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-surface-raised">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-18">
          <Reveal className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-brand">Akses sehari-hari</p>
              <h2 className="mt-3 max-w-md text-balance text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">Semuanya lebih dekat dari satu pintu masuk.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">Dibuat untuk dibuka dari WhatsApp, dibaca tanpa zoom, lalu langsung mengurus layanan yang tepat.</p>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3.25rem_1fr_auto] sm:items-center sm:gap-5 sm:py-6">
                    <span className="grid size-12 place-items-center rounded-[15px] bg-brand-soft text-brand-deep"><Icon size={23} weight="fill" aria-hidden="true" /></span>
                    <span>
                      <span className="block text-lg font-bold tracking-[-0.035em] text-ink group-hover:text-brand">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">{item.description}</span>
                    </span>
                    <ArrowRight className="hidden text-brand transition-transform group-hover:translate-x-1 sm:block" size={21} weight="bold" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <Reveal className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-brand">Panduan yang hidup</p>
            <h2 className="mt-3 max-w-md text-balance text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">Aturan bersama tidak harus berhenti di PDF.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">Setiap bagian dapat dibagikan lewat tautannya sendiri dan dikelola RT dari browser saat informasi perlu diperbarui.</p>
            <Link href="/panduan-harmonis" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-deep hover:gap-3 hover:text-brand">
              Jelajahi panduan lengkap <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>
          <div className="border-y border-line">
            {data.guideSections.map((section) => (
              <Link key={section.slug} href={`/panduan-harmonis#${section.slug}`} className="group flex gap-5 border-b border-line py-5 first:pt-0 last:border-b-0 last:pb-0 sm:items-center sm:py-6">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand sm:mt-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold tracking-[-0.035em] text-ink group-hover:text-brand">{section.title}</span>
                  <span className="mt-1.5 block text-sm leading-6 text-ink-muted">{section.summary}</span>
                </span>
                <ArrowRight className="mt-1 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand sm:mt-0" size={19} weight="bold" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-line bg-brand-soft">
        <Reveal className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 sm:px-8 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex max-w-2xl items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={25} weight="fill" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.04em] text-ink">Informasi selalu dapat dikelola.</h2>
              <p className="mt-1.5 text-sm leading-6 text-ink-muted">RT dapat memperbarui iuran, panduan, pengumuman, dan tautan layanan dari panel yang aman.</p>
            </div>
          </div>
          <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:bg-brand active:translate-y-0">
            Masuk ke admin RT
          </Link>
        </Reveal>
      </section>
    </>
  );
}
