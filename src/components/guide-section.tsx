import { Car, CheckCircle, Hammer, Motorcycle, ShieldCheck, Trash } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { FeeSchedule, GuideSection } from "@/lib/content";
import { FeeList } from "@/components/fee-list";
import { MarkdownContent } from "@/components/markdown-content";

function SectionVisual({ slug }: { slug: string }) {
  if (slug === "parkir") {
    const entries = [
      ["Mobil pertama", "Masuk carport rumah", Car],
      ["Mobil kedua", "Mepet pembatas tepi jalan", Car],
      ["Mobil ketiga dan tamu", "Rumah kosong atau pojok gang", Car],
    ] as const;
    return (
      <div className="mt-8 grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {entries.map(([title, text, Icon]) => (
          <div key={title} className="px-4 py-5 first:pl-0 last:pr-0 sm:px-5">
            <Icon className="text-brand" size={25} weight="fill" aria-hidden="true" />
            <p className="mt-4 text-base font-bold text-ink">{title}</p>
            <p className="mt-1 text-base leading-7 text-ink-muted">{text}</p>
          </div>
        ))}
      </div>
    );
  }
  if (slug === "stiker-kendaraan") {
    return (
      <><div className="mt-8 grid gap-0 border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-line">
        <div className="py-5 sm:pr-7"><Car size={30} weight="fill" className="text-brand" aria-hidden="true" /><p className="mt-4 text-base font-bold text-ink">Stiker mobil</p><p className="mt-1 text-base leading-7 text-ink-muted">Dipasang di kaca depan dari bagian dalam. Dari arah depan mobil, posisinya berada di sisi kanan atas atau bawah; dari posisi pengemudi, sisi kiri.</p></div>
        <div className="border-t border-line py-5 sm:border-t-0 sm:pl-7"><Motorcycle size={30} weight="fill" className="text-brand" aria-hidden="true" /><p className="mt-4 text-base font-bold text-ink">Stiker motor</p><p className="mt-1 text-base leading-7 text-ink-muted">Dipasang di bagian depan motor dan diusahakan tidak menutupi pelat nomor.</p></div>
      </div><aside className="mt-6 border-y border-line py-5"><p className="text-sm font-bold text-ink">Arsip QR tutorial dari panduan lama</p><p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">Target tautan QR belum dapat diverifikasi dari sumber. Kode dipertahankan sebagai arsip, tanpa membuat tautan yang menebak tujuan.</p><div className="mt-4 flex flex-wrap gap-5"><figure><Image src="/images/guide/qr-stiker-mobil.png" alt="QR tutorial stiker mobil dari panduan lama" width={128} height={128} className="border border-line" /><figcaption className="mt-2 text-xs font-bold text-ink-muted">Stiker mobil</figcaption></figure><figure><Image src="/images/guide/qr-stiker-motor.png" alt="QR tutorial stiker motor dari panduan lama" width={128} height={128} className="border border-line" /><figcaption className="mt-2 text-xs font-bold text-ink-muted">Stiker motor</figcaption></figure></div></aside></>
    );
  }
  if (slug === "renovasi") {
    return <aside className="mt-8 flex gap-4 border-l-2 border-brand bg-surface-subtle px-5 py-5"><Hammer size={29} weight="fill" className="shrink-0 text-brand" aria-hidden="true" /><div><p className="text-base font-bold text-ink">Jam kerja renovasi</p><p className="mt-1 text-base leading-7 text-ink-muted">Pekerjaan tukang berlangsung pukul 07.00 hingga 17.00 WIB. Pekerjaan tanpa suara bising seperti pengecatan menjadi pengecualian.</p></div></aside>;
  }
  if (slug === "sampah-rumah-tangga") {
    return <aside className="mt-8 flex items-start gap-5 border-y border-line py-6"><Trash size={31} weight="fill" className="mt-1 shrink-0 text-brand" aria-hidden="true" /><div><p className="text-3xl font-bold tracking-[-0.055em] text-ink">240 liter</p><p className="mt-1 max-w-md text-base leading-7 text-ink-muted">Acuan kapasitas tempat sampah pengganti agar sampah tertampung dengan tertutup dan aman.</p></div></aside>;
  }
  return null;
}

export function GuideSectionArticle({ section, fees }: { section: GuideSection; fees: FeeSchedule[] }) {
  return (
    <article id={section.slug} tabIndex={-1} className="scroll-mt-28 border-t border-line py-12 first:border-t-0 first:pt-0 sm:py-16">
      <div className="border-l-2 border-brand pl-4">
        <div className="flex items-center gap-3"><CheckCircle className="shrink-0 text-brand" size={21} weight="fill" aria-hidden="true" /><h2 tabIndex={-1} className="text-2xl font-bold tracking-[-0.055em] text-ink sm:text-3xl">{section.title}</h2></div>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">{section.summary}</p>
        </div>
      {section.slug === "iuran" ? <div className="mt-8"><FeeList fees={fees} /></div> : null}
      <div className="mt-8"><MarkdownContent>{section.bodyMarkdown}</MarkdownContent></div>
      <SectionVisual slug={section.slug} />
      {section.slug === "stiker-kendaraan" ? <p className="mt-6 flex gap-2 border-l-2 border-brand bg-surface-subtle px-4 py-4 text-sm leading-6 text-ink-muted"><ShieldCheck className="mt-0.5 shrink-0 text-brand" size={19} weight="fill" aria-hidden="true" />Bila target QR resmi sudah dipastikan, pengurus dapat menambahkan tautan tutorial melalui pembaruan konten.</p> : null}
    </article>
  );
}
