import { ArrowRight, BookOpenText, FileText, HouseLine, ShieldCheck, UsersThree, Wallet, Wrench } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Layanan Warga", description: "Layanan warga OPAL Residence yang dapat diajukan langsung dari portal." };

type Service = { href: string; title: string; description: string; note?: string; icon: typeof FileText };

const groups: Array<{ label: string; description: string; services: Service[] }> = [
  { label: "Data dan keuangan", description: "Layanan yang memerlukan jejak pengurus dan perlindungan informasi yang jelas.", services: [
    { href: "/pendataan-warga", title: "Pendataan warga", description: "Formulir satu rumah per pengisian, termasuk unggahan KTP dan KK ke penyimpanan privat.", note: "Berkas identitas tidak tampil di publik", icon: UsersThree },
    { href: "/kas", title: "Kas OPAL", description: "Ringkasan pembukuan publik, iuran aktif, dan informasi rekening Kas.", icon: Wallet },
  ] },
  { label: "Surat resmi", description: "Ajukan dari web. RT memeriksa data, lalu menerbitkan dokumen bernomor yang siap dicetak.", services: [
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

function ServiceLink({ service }: { service: Service }) {
  const Icon = service.icon;
  return (
    <Link href={service.href} className="public-row-link group grid min-h-[7rem] grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-6 pl-4 transition sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:gap-5 sm:pl-5">
      <Icon size={27} weight="fill" className="text-brand" aria-hidden="true" />
      <span className="min-w-0"><span className="block text-lg font-bold tracking-[-0.04em] text-ink transition group-hover:text-brand sm:text-xl">{service.title}</span><span className="mt-1.5 block max-w-xl text-sm leading-6 text-ink-muted sm:text-[0.95rem]">{service.description}</span>{service.note ? <span className="mt-3 block text-sm font-bold text-brand-deep">{service.note}</span> : null}</span>
      <ArrowRight className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" size={21} weight="bold" aria-hidden="true" />
    </Link>
  );
}

export default function LayananPage() {
  return <>
    <section className="overflow-hidden bg-action text-ink-inverse">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[460px] lg:grid-cols-[0.88fr_1.12fr]">
        <div className="flex items-center px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-14">
          <div className="max-w-xl"><p className="text-xs font-extrabold tracking-[0.16em] text-brand-highlight">LAYANAN WARGA</p><h1 className="public-display mt-5 text-4xl font-bold leading-[0.96] sm:text-5xl lg:text-6xl">Pilih layanan warga yang Anda perlukan.</h1><p className="mt-6 max-w-lg text-base leading-7 text-ink-inverse/78 sm:text-lg">Ajukan surat, perbarui data rumah, atau cari informasi lingkungan dari portal ini.</p></div>
        </div>
        <div className="hero-image-drift relative min-h-[280px] overflow-hidden lg:min-h-0"><Image src="/images/opal-arrival-evening.png" alt="Akses masuk OPAL Residence pada malam hari" fill priority sizes="(max-width: 1024px) 100vw, 59vw" className="object-cover object-center" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,48,41,0.45),transparent_48%)]" aria-hidden="true" /></div>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="grid gap-8 border-b border-line pb-12 lg:grid-cols-[0.38fr_1fr] lg:gap-16 lg:pb-16">
        <div><p className="public-kicker">Mulai di sini</p><h2 className="public-display mt-4 text-3xl font-bold leading-[1.02] text-ink">Kirim data rumah dengan aman.</h2></div>
        <Link href="/pendataan-warga" className="group relative overflow-hidden bg-brand px-6 py-8 text-on-brand transition hover:bg-brand-deep sm:px-9 sm:py-10"><UsersThree size={31} weight="fill" className="text-brand-highlight" aria-hidden="true" /><h2 className="public-display mt-12 max-w-xl text-3xl font-bold leading-[1.02] sm:text-4xl">Pendataan warga</h2><p className="mt-4 max-w-xl text-base leading-7 text-on-brand/80">Isi satu kali untuk satu rumah. KTP dan KK disimpan secara privat dan hanya diperiksa pengurus yang berwenang.</p><span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-on-brand">Isi pendataan <ArrowRight size={18} weight="bold" aria-hidden="true" /></span></Link>
      </div>
      {groups.map((group) => <section key={group.label} className="grid gap-8 border-b border-line py-12 lg:grid-cols-[0.38fr_1fr] lg:gap-16 lg:py-16"><div><h2 className="public-display text-2xl font-bold leading-[1.04] text-ink sm:text-3xl">{group.label}</h2><p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">{group.description}</p></div><div className="border-t border-line">{group.services.map((service) => <ServiceLink key={service.href} service={service} />)}</div></section>)}
    </section>
  </>;
}
