import { ArrowRight, BookOpenText, FileText, HouseLine, ShieldCheck, UsersThree, Wallet, Wrench } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export const metadata = { title: "Layanan Warga", description: "Layanan warga OPAL Residence yang dapat diajukan langsung dari portal." };

type Service = { href: string; title: string; description: string; note?: string; icon: typeof FileText };

const groups: Array<{ label: string; description: string; services: Service[] }> = [
  { label: "Keuangan dan data", description: "Informasi lingkungan yang memerlukan jejak dan pemeriksaan pengurus.", services: [
    { href: "/kas", title: "Kas OPAL", description: "Ringkasan pembukuan publik, iuran aktif, dan informasi rekening Kas.", icon: Wallet },
    { href: "/pendataan-warga", title: "Pendataan warga", description: "Formulir satu rumah per pengisian, termasuk unggahan KTP dan KK ke penyimpanan privat.", note: "Berkas identitas tidak tampil di publik", icon: UsersThree },
  ] },
  { label: "Surat resmi", description: "Diajukan dari web, ditinjau RT, lalu diterbitkan sebagai PDF bernomor untuk dicetak.", services: [
    { href: "/surat/pindah-rumah", title: "Surat Keterangan Pindah Rumah", description: "Permohonan pindah dengan data asal, tujuan, dan pengikut.", icon: FileText },
    { href: "/surat/domisili", title: "Surat Keterangan Domisili", description: "Permohonan keterangan domisili OPAL untuk kebutuhan resmi.", icon: FileText },
    { href: "/surat/belum-menikah", title: "Surat Keterangan Belum Menikah", description: "Permohonan surat keterangan yang diperiksa sebelum diterbitkan RT.", icon: FileText },
  ] },
  { label: "Lingkungan dan rumah", description: "Referensi operasional dan material yang sebelumnya tersebar sebagai dokumen.", services: [
    { href: "/panduan-harmonis", title: "Panduan Harmonis Warga OPAL", description: "Aturan iuran, parkir, stiker, renovasi, dan sampah dalam halaman yang bisa dibagikan per bagian.", icon: BookOpenText },
    { href: "/petugas", title: "Petugas Pos & Taman", description: "Direktori kerja petugas dan WhatsApp yang tersedia untuk warga.", icon: ShieldCheck },
    { href: "/spesifikasi-rumah", title: "Spesifikasi Cat & Keramik", description: "Referensi material rumah asli OPAL untuk perawatan dan renovasi.", icon: Wrench },
    { href: "/denah", title: "Denah OPAL Tipe 6 x 12", description: "Empat lembar denah asli dalam galeri web yang nyaman dibuka dari ponsel.", icon: HouseLine },
  ] },
];

function ServiceLink({ service, featured = false }: { service: Service; featured?: boolean }) {
  const Icon = service.icon;
  return <Link href={service.href} className={featured ? "group relative grid min-h-[280px] content-between rounded-[16px] bg-brand p-7 text-on-brand transition hover:-translate-y-1 hover:bg-brand-deep sm:p-8" : "group grid min-h-[6rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-5 sm:grid-cols-[3rem_1fr_auto] sm:gap-5"}>
    {featured ? <><span className="grid size-12 place-items-center rounded-xl bg-black/10"><Icon size={24} weight="fill" aria-hidden="true" /></span><span><span className="block text-2xl font-bold tracking-[-0.05em]">{service.title}</span><span className="mt-3 block max-w-sm text-base leading-7 opacity-85">{service.description}</span>{service.note ? <span className="mt-5 block text-sm font-bold opacity-80">{service.note}</span> : null}</span><ArrowRight className="absolute right-7 top-8 sm:right-8 sm:top-9" size={22} weight="bold" aria-hidden="true" /></> : <><span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-deep"><Icon size={22} weight="fill" aria-hidden="true" /></span><span className="min-w-0"><span className="block text-base font-bold tracking-[-0.035em] text-ink group-hover:text-brand sm:text-lg">{service.title}</span><span className="mt-1.5 block text-sm leading-6 text-ink-muted sm:text-[0.95rem]">{service.description}</span>{service.note ? <span className="mt-3 block text-sm font-bold text-brand-deep">{service.note}</span> : null}</span><ArrowRight className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" size={20} weight="bold" aria-hidden="true" /></>}
  </Link>;
}

export default function LayananPage() {
  return <>
    <section className="border-b border-line bg-surface-subtle">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <p className="text-sm font-bold text-brand">Layanan warga</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold tracking-[-0.065em] text-ink sm:text-5xl lg:text-6xl lg:leading-[0.98]">Pilih layanan yang Anda butuhkan.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">Pilih layanan, isi data, lalu pantau prosesnya bersama RT. Semua jalur dibuat jelas dari awal sampai selesai.</p>
      </div>
    </section>
    <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <section className="grid gap-8 border-b border-line pb-12 lg:grid-cols-[0.42fr_1fr] lg:gap-16 lg:pb-16">
        <div><h2 className="text-2xl font-bold tracking-[-0.05em] text-ink">Keuangan dan data</h2><p className="mt-3 max-w-xs text-sm leading-6 text-ink-muted">Informasi yang perlu jejak pengurus dan perlindungan data yang jelas.</p></div>
        <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]"><ServiceLink service={groups[0].services[1]} featured /><div className="border-t border-line sm:border-t-0 sm:border-l sm:pl-6"><ServiceLink service={groups[0].services[0]} /></div></div>
      </section>
      {groups.slice(1).map((group) => <section key={group.label} className="grid gap-8 border-b border-line py-12 lg:grid-cols-[0.42fr_1fr] lg:gap-16 lg:py-16"><div><h2 className="text-2xl font-bold tracking-[-0.05em] text-ink">{group.label}</h2><p className="mt-3 max-w-xs text-sm leading-6 text-ink-muted">{group.description}</p></div><div className="border-t border-line">{group.services.map((service) => <ServiceLink key={service.href} service={service} />)}</div></section>)}
    </div>
  </>;
}
