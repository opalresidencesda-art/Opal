import {
  ArrowRight,
  BookOpenText,
  ShieldCheck,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { FeeList } from "@/components/fee-list";
import { HomeAnnouncementCarousel } from "@/components/home-announcement-carousel";
import { HomePortalSearch } from "@/components/home-portal-search";
import { HomeQuickAccess } from "@/components/home-quick-access";
import { PublicHashScroll } from "@/components/public-hash-scroll";
import { PublicReveal } from "@/components/public-reveal";
import { getPortalData } from "@/lib/data";
import { buildHomeSearchIndex } from "@/lib/home-search";

export default async function Home() {
  const data = await getPortalData();

  return (
    <>
      <PublicHashScroll />
      <section className="home-hero relative isolate min-h-[760px] overflow-hidden bg-action text-ink-inverse sm:min-h-[740px] lg:min-h-[min(800px,100dvh)]">
        <Image
          src="/images/opal-arrival-evening.png"
          alt="Akses masuk OPAL Residence pada malam hari"
          fill
          priority
          sizes="100vw"
          className="home-hero-image object-cover object-[62%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,19,16,0.42)_0%,rgba(3,19,16,0.68)_48%,rgba(3,19,16,0.94)_100%)] lg:bg-[linear-gradient(90deg,rgba(3,19,16,0.72)_0%,rgba(3,19,16,0.58)_50%,rgba(3,19,16,0.4)_100%)]" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[760px] max-w-[1440px] items-center px-5 py-28 sm:min-h-[740px] sm:px-8 sm:py-32 lg:min-h-[min(800px,100dvh)] lg:px-10 lg:py-28">
          <div className="w-full">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="public-display text-[2.15rem] font-bold leading-[0.98] sm:text-5xl lg:text-[3.5rem]">Cari informasi warga.</h1>
              <p className="mx-auto mt-3 max-w-2xl text-[0.82rem] leading-6 text-ink-inverse/78 sm:text-[0.95rem]">Temukan surat, iuran, panduan, atau pengumuman tanpa membuka menu satu per satu.</p>
              <HomePortalSearch index={buildHomeSearchIndex(data)} />
            </div>

            <div className="mx-auto mt-8 grid max-w-5xl overflow-hidden rounded-[1.5rem] bg-[#111e1d] shadow-[0_18px_50px_rgba(2,20,16,0.24)] lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
              <div className="min-w-0">
                <HomeAnnouncementCarousel announcements={data.announcements} />
              </div>
              <aside className="flex min-h-[18rem] flex-col border-t border-[#1b2d2b] bg-[#dce7e4] px-5 py-5 text-[#0b1514] sm:px-7 sm:py-7 lg:border-t-0 lg:border-l" aria-labelledby="home-start-title">
                <div>
                  <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.13em] text-[#087568]">Mulai dari sini</p>
                  <h2 id="home-start-title" className="mt-3 text-[1.2rem] font-extrabold leading-[1.12] tracking-[-0.04em] text-[#09231e]">Pilih jalur yang paling dibutuhkan.</h2>
                </div>
                <div className="mt-7 border-y border-[#d4ddd7]">
                  <Link href="#akses-cepat" className="group grid min-h-[5.75rem] grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#d4ddd7] py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand text-on-brand" aria-hidden="true"><ArrowRight size={19} weight="bold" /></span>
                    <span>
                      <span className="block text-[0.88rem] font-extrabold text-[#09231e]">Akses cepat warga</span>
                      <span className="mt-1 block text-[0.72rem] leading-5 text-[#48605a]">Surat, data, dan keuangan</span>
                    </span>
                    <ArrowRight className="text-[#586d67] transition-transform group-hover:translate-x-1 group-hover:text-[#05564d]" size={20} weight="bold" aria-hidden="true" />
                  </Link>
                  <Link href="/panduan-harmonis" className="group grid min-h-[5.75rem] grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset">
                    <span className="grid size-9 place-items-center rounded-xl border border-[#d4ddd7] text-[#087568]" aria-hidden="true"><BookOpenText size={20} weight="fill" /></span>
                    <span>
                      <span className="block text-[0.88rem] font-extrabold text-[#09231e]">Panduan Harmonis</span>
                      <span className="mt-1 block text-[0.72rem] leading-5 text-[#48605a]">Aturan dan informasi lingkungan</span>
                    </span>
                    <ArrowRight className="text-[#586d67] transition-transform group-hover:translate-x-1 group-hover:text-[#05564d]" size={20} weight="bold" aria-hidden="true" />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <PublicReveal>
        <section id="akses-cepat" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28" aria-labelledby="home-services-title">
          <div className="max-w-3xl">
            <p className="public-kicker">Akses cepat warga</p>
            <h2 id="home-services-title" tabIndex={-1} className="hash-scroll-heading public-display mt-4 text-[1.8rem] font-bold leading-[0.98] text-ink sm:text-[2.4rem] lg:text-5xl">
              Pilih kebutuhan Anda.
            </h2>
            <p className="mt-5 max-w-2xl text-[0.8rem] leading-6 text-ink-muted sm:text-[0.9rem] sm:leading-7">
              Tekan salah satu kategori, lalu pilih layanan atau informasi yang ingin dibuka.
            </p>
          </div>

          <HomeQuickAccess />
        </section>
      </PublicReveal>

      <PublicReveal>
        <section id="iuran" className="overflow-hidden bg-action text-on-action" aria-labelledby="home-fees-title">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
            <div className="grid overflow-hidden border-y border-white/20 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
              <div className="flex flex-col justify-between px-1 py-8 sm:px-2 sm:py-10 lg:py-12 lg:pr-16">
                <div>
                  <div className="flex items-center gap-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-highlight">
                    <span className="grid size-9 place-items-center border border-white/35 text-on-action" aria-hidden="true">
                      <Wallet size={18} weight="fill" />
                    </span>
                    Iuran warga
                  </div>
                  <h2 id="home-fees-title" tabIndex={-1} className="hash-scroll-heading public-display mt-7 max-w-xl text-[1.9rem] font-bold leading-[0.98] text-on-action sm:text-[2.55rem]">
                    Lihat nominal iuran yang sedang berlaku.
                  </h2>
                  <p className="mt-5 max-w-lg text-[0.82rem] leading-6 text-on-action/74 sm:text-[0.9rem] sm:leading-7">
                    RT mencantumkan nominal per rumah beserta jadwal berlakunya, agar pembayaran lebih mudah dipastikan.
                  </p>
                </div>
                <div className="mt-9 border-l-2 border-brand pl-4 sm:mt-12">
                  <p className="max-w-sm text-[0.72rem] leading-6 text-on-action/72">Pembayaran dihitung per rumah, bukan per KK.</p>
                  <Link href="/kas" className="group mt-5 inline-flex min-h-11 items-center gap-2 border border-white/35 px-4 text-[0.72rem] font-extrabold text-on-action transition hover:border-brand-highlight hover:bg-brand-highlight hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-highlight focus-visible:ring-offset-4 focus-visible:ring-offset-action">
                    Lihat transparansi kas <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} weight="bold" aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="border-t border-white/20 bg-surface-raised text-ink lg:border-t-0 lg:border-l">
                <FeeList fees={data.fees} variant="home" />
              </div>
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
              <h2 className="public-display text-2xl font-bold leading-[1.02] text-ink">RT memperbarui informasi dari portal admin.</h2>
              <p className="mt-3 max-w-2xl text-[0.8rem] leading-6 text-ink-muted">
                Pengumuman, panduan, iuran, dan layanan warga dikelola dari satu tempat.
              </p>
            </div>
            <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-action bg-action px-5 text-[0.7rem] font-bold text-on-action shadow-[0_12px_28px_rgba(7,36,30,0.16)] transition hover:-translate-y-1 hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface-raised">
              Masuk admin RT
            </Link>
          </div>
        </section>
      </PublicReveal>
    </>
  );
}
