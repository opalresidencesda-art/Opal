import { ArrowRight, BookOpenText, FileText, HouseLine, ShieldCheck, UsersThree, Wallet, Wrench } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

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
    { href: "/denah", title: "Denah OPAL Tipe 6 × 12", description: "Empat lembar denah asli dalam galeri web yang nyaman dibuka dari ponsel.", icon: HouseLine },
  ] },
];

export default function LayananPage() {
  return <>
    <section className="border-b border-line bg-surface-subtle"><Reveal className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-10 lg:py-20"><p className="text-sm font-semibold text-brand">Layanan warga</p><h1 className="mt-4 max-w-4xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl lg:text-6xl lg:leading-[0.96]">Bukan kumpulan tautan. Tempat mengurus kebutuhan lingkungan.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">Layanan OPAL dipindahkan menjadi alur web yang jelas: isi, kirim, diperiksa RT, lalu diterbitkan bila diperlukan.</p></Reveal></section>
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12"><div className="grid gap-0">{groups.map((group, index) => <Reveal key={group.label} delay={Math.min(index * 0.05, 0.14)}><section className="grid gap-7 border-t border-line py-10 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(13rem,0.45fr)_minmax(0,1fr)] lg:gap-14 lg:py-14"><div><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">{group.label}</h2><p className="mt-3 max-w-xs text-sm leading-6 text-ink-muted">{group.description}</p></div><div className="divide-y divide-line border-y border-line">{group.services.map((service) => { const Icon = service.icon; return <Link key={service.href} href={service.href} className="group grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[3.25rem_1fr_auto] sm:items-center sm:gap-5 sm:py-6"><span className="grid size-12 place-items-center rounded-[15px] bg-brand-soft text-brand-deep"><Icon size={23} weight="fill" aria-hidden="true" /></span><span className="min-w-0"><span className="block text-base font-bold tracking-[-0.025em] text-ink group-hover:text-brand">{service.title}</span><span className="mt-1.5 block text-sm leading-6 text-ink-muted">{service.description}</span>{service.note ? <span className="mt-3 inline-flex rounded-full border border-line bg-warm px-2.5 py-1 text-xs font-bold text-ink-muted">{service.note}</span> : null}</span><ArrowRight className="hidden shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand sm:block" size={20} weight="bold" aria-hidden="true" /></Link>; })}</div></section></Reveal>)}</div></main>
  </>;
}
