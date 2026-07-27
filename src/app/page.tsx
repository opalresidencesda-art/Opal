import {
  ArrowRight,
  Bell,
  BookOpenText,
  ClipboardText,
  CurrencyCircleDollar,
  FileText,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { FeeList } from "@/components/fee-list";
import { PublicReveal } from "@/components/public-reveal";
import { getPortalData } from "@/lib/data";
import { formatDate } from "@/lib/format";

const quickLinks = [
  {
    href: "/pendataan-warga",
    title: "Pendataan warga",
    description: "Perbarui data penghuni, status rumah, KTP, dan KK dalam satu formulir.",
    image: "/images/services/resident-data-card.png",
    overlayClassName: "bg-[linear-gradient(180deg,rgba(3,19,16,0.06)_8%,rgba(3,19,16,0.34)_52%,rgba(3,19,16,0.94)_100%)]",
    icon: ClipboardText,
    className: "bg-brand text-white lg:col-span-7 lg:row-span-2 lg:min-h-[25rem]",
    iconClassName: "bg-white/12 text-brand-highlight",
  },
  {
    href: "/layanan",
    title: "Ajukan surat",
    description: "Domisili, pindah rumah, atau belum menikah.",
    image: "/images/services/document-request-card.png",
    overlayClassName: "bg-[linear-gradient(180deg,rgba(3,19,16,0.02)_8%,rgba(3,19,16,0.2)_48%,rgba(3,19,16,0.9)_100%)]",
    icon: FileText,
    className: "bg-surface-raised text-white lg:col-span-5",
    iconClassName: "bg-brand-soft text-brand-deep",
  },
  {
    href: "/kas",
    title: "Kas dan iuran",
    description: "Nominal aktif dan pembukuan publik OPAL.",
    image: "/images/services/cash-ledger-card.png",
    overlayClassName: "bg-[linear-gradient(180deg,rgba(3,19,16,0.04)_4%,rgba(3,19,16,0.3)_48%,rgba(3,19,16,0.95)_100%)]",
    icon: CurrencyCircleDollar,
    className: "bg-action text-white lg:col-span-5",
    iconClassName: "bg-white/10 text-brand-highlight",
  },
];

export default async function Home() {
  const data = await getPortalData();
  const announcement = data.announcements.find((item) => item.pinned) ?? data.announcements[0];

  return (
    <>
      <section className="home-hero relative isolate min-h-[780px] overflow-hidden bg-action text-ink-inverse sm:min-h-[820px] lg:min-h-[min(900px,100dvh)]">
        <Image
          src="/images/opal-arrival-evening.png"
          alt="Akses masuk OPAL Residence pada malam hari"
          fill
          priority
          sizes="100vw"
          className="home-hero-image object-cover object-[62%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,19,16,0.18)_0%,rgba(3,19,16,0.42)_38%,rgba(3,19,16,0.96)_100%)] lg:bg-[linear-gradient(90deg,rgba(3,19,16,0.92)_0%,rgba(3,19,16,0.72)_42%,rgba(3,19,16,0.18)_76%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(3,19,16,0.5)_100%)]" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[780px] max-w-[1440px] items-end px-5 pb-20 pt-36 sm:min-h-[820px] sm:px-8 sm:pb-24 lg:min-h-[min(900px,100dvh)] lg:px-10 lg:pb-20">
          <div className="max-w-4xl">
            <p className="text-xs font-extrabold tracking-[0.18em] text-brand-highlight">OPAL RESIDENCE, SIDOARJO</p>
            <h1 className="public-display mt-5 max-w-[12ch] text-[3.75rem] font-bold leading-[0.9] sm:text-[5rem] lg:text-[6.6rem]">
              Rumah tenang. Semua terhubung.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-inverse/78 sm:text-lg">
              Cek pengumuman, iuran, surat, dan panduan warga dari satu portal.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/layanan"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink-inverse px-6 text-base font-bold text-action shadow-[0_20px_60px_rgba(2,20,16,0.25)] transition hover:-translate-y-1 hover:bg-brand-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action"
              >
                Buka layanan <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
              <Link
                href="/panduan-harmonis"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/35 bg-white/5 px-6 text-base font-bold text-ink-inverse backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action"
              >
                Lihat panduan
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-20 max-w-[1440px] px-5 sm:-mt-14 sm:px-8 lg:px-10" aria-label="Pengumuman terbaru">
        <article className="overflow-hidden rounded-[1.75rem] bg-action text-on-action shadow-[0_26px_70px_rgba(3,25,21,0.24)] lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="flex items-center justify-between gap-5 bg-brand px-5 py-4 text-on-brand sm:px-7 lg:flex-col lg:items-start lg:justify-between lg:px-8 lg:py-9">
            <div className="flex items-center gap-3 lg:block">
              <Bell size={24} weight="fill" aria-hidden="true" />
              <p className="text-sm font-extrabold lg:mt-8 lg:text-lg">Kabar terbaru</p>
            </div>
            {announcement ? (
              <time dateTime={announcement.publishedAt} className="shrink-0 text-right text-xs font-bold leading-5 opacity-80 lg:text-left">
                Diperbarui
                <span className="block">{formatDate(announcement.publishedAt)}</span>
              </time>
            ) : null}
          </div>

          <div className="relative px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
            {announcement ? (
              <>
                <h2 className="max-w-4xl text-[1.65rem] font-extrabold leading-[1.08] tracking-[-0.05em] sm:text-3xl">
                  {announcement.title}
                </h2>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-on-action/74 sm:text-base sm:leading-7">
                  {announcement.body}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[1.65rem] font-extrabold leading-[1.08] tracking-[-0.05em] sm:text-3xl">
                  Belum ada pengumuman baru.
                </h2>
                <p className="mt-3 text-sm leading-6 text-on-action/74 sm:text-base">
                  Informasi terbaru dari pengurus RT akan tampil di sini.
                </p>
              </>
            )}
          </div>
        </article>
      </section>

      <PublicReveal>
        <section className="mx-auto max-w-[1440px] px-5 py-24 sm:px-8 sm:py-28 lg:px-10 lg:py-32" aria-labelledby="home-services-title">
          <div className="max-w-3xl">
            <h2 id="home-services-title" className="public-display text-4xl font-bold leading-[0.98] text-ink sm:text-5xl lg:text-6xl">
              Urus kebutuhan rumah dari sini.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
              Pilih pendataan, surat, kas, atau panduan tanpa mencari tautan lama.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:grid-rows-[repeat(2,19rem)]">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`home-service-card group relative isolate flex min-h-[13rem] flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 shadow-[0_18px_50px_rgba(7,36,30,0.08)] sm:p-8 ${item.className}`}
                >
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="absolute inset-0 z-0 object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                    aria-hidden="true"
                  />
                  <span className={`absolute inset-0 z-[1] ${item.overlayClassName}`} aria-hidden="true" />
                  <span className={`relative z-10 grid size-12 place-items-center rounded-2xl ${item.iconClassName}`}>
                    <Icon size={24} weight="fill" aria-hidden="true" />
                  </span>
                  <span className="relative z-10 mt-12 flex items-end justify-between gap-6">
                    <span>
                      <span className="block text-2xl font-bold tracking-[-0.05em] sm:text-3xl">{item.title}</span>
                      <span className="mt-2 block max-w-lg text-sm leading-6 opacity-75 sm:text-base">{item.description}</span>
                    </span>
                    <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={24} weight="bold" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}

            <Link
              href="/panduan-harmonis"
              className="home-guide-card group relative isolate flex min-h-[28rem] overflow-hidden rounded-[1.75rem] text-ink-inverse shadow-[0_24px_70px_rgba(7,36,30,0.15)] lg:col-span-12"
            >
              <Image
                src="/images/opal-neighborhood-hero.png"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 1360px"
                className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.025]"
                aria-hidden="true"
              />
              <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,19,16,0.9)_0%,rgba(3,19,16,0.65)_45%,rgba(3,19,16,0.08)_82%)]" aria-hidden="true" />
              <span className="relative flex w-full flex-col justify-between p-6 sm:p-8 lg:p-10">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/12 text-brand-highlight backdrop-blur-sm">
                  <BookOpenText size={25} weight="fill" aria-hidden="true" />
                </span>
                <span className="max-w-xl">
                  <span className="block text-3xl font-bold tracking-[-0.055em] sm:text-4xl">Panduan harmonis</span>
                  <span className="mt-3 block max-w-lg text-base leading-7 text-ink-inverse/78">
                    {data.guideSections.slice(0, 3).map((section) => section.title).join(", ")}
                    {data.guideSections.length > 3 ? `, dan ${data.guideSections.length - 3} topik lainnya.` : "."}
                  </span>
                  <span className="mt-7 inline-flex items-center gap-2 font-bold">
                    Buka semua panduan <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} weight="bold" aria-hidden="true" />
                  </span>
                </span>
              </span>
            </Link>
          </div>
        </section>
      </PublicReveal>

      <PublicReveal>
        <section className="bg-surface-subtle" aria-labelledby="home-fees-title">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20 lg:px-10 lg:py-28">
            <div>
              <h2 id="home-fees-title" className="public-display max-w-xl text-4xl font-bold leading-[0.98] text-ink sm:text-5xl">
                Lihat nominal iuran yang sedang berlaku.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">
                RT mencantumkan nominal per rumah beserta jadwal berlakunya.
              </p>
              <Link href="/kas" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-action px-5 text-sm font-bold text-on-action transition hover:-translate-y-1 hover:bg-brand hover:text-on-brand">
                Lihat transparansi kas <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-[1.75rem] border border-white/70 bg-surface-raised p-6 shadow-[0_24px_70px_rgba(7,36,30,0.09)] sm:p-8 lg:p-10">
              <FeeList fees={data.fees} compact />
            </div>
          </div>
        </section>
      </PublicReveal>

      <PublicReveal>
        <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
          <div className="grid gap-10 rounded-[1.75rem] bg-surface-raised p-6 shadow-[0_20px_60px_rgba(7,36,30,0.07)] sm:p-9 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8 lg:p-10">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
              <ShieldCheck size={28} weight="fill" aria-hidden="true" />
            </span>
            <div>
              <h2 className="public-display text-3xl font-bold leading-[1.02] text-ink">RT memperbarui informasi dari portal admin.</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink-muted">
                Pengumuman, panduan, iuran, dan layanan warga dikelola dari satu tempat.
              </p>
            </div>
            <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-action bg-action px-5 text-sm font-bold text-on-action shadow-[0_12px_28px_rgba(7,36,30,0.16)] transition hover:-translate-y-1 hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised">
              Masuk admin RT
            </Link>
          </div>
        </section>
      </PublicReveal>
    </>
  );
}
