import { FileText, LinkSimpleBreak, Receipt, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatRupiah } from "@/lib/format";
import { getHousePortal } from "@/lib/private-portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Akses Rumah" };

const documentLabels = { move: "Pindah rumah", domicile: "Domisili", single: "Belum menikah" };
const statusLabels: Record<string, string> = { submitted: "Diajukan", in_review: "Diperiksa", needs_revision: "Perlu revisi", approved: "Disetujui", rejected: "Ditolak", issued: "Diterbitkan", paid: "Tercatat", pending: "Menunggu", waived: "Dikecualikan" };

export default async function RumahTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const house = await getHousePortal(token);
  if (!house) notFound();
  return <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
    <section className="border-b border-line pb-9"><p className="text-sm font-semibold text-brand">Akses rumah privat</p><h1 className="mt-3 text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl">{house.property.unitCode}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Tautan ini khusus untuk satu rumah. Halaman ini tidak menampilkan KTP, KK, data penghuni, maupun dokumen identitas.</p><p className="mt-6 flex gap-2 text-sm font-semibold text-ink-muted"><ShieldCheck size={20} weight="fill" className="shrink-0 text-brand" aria-hidden="true" />Jangan teruskan tautan ini. RT dapat mencabut atau memutar tautan kapan saja.</p></section>
    <div className="mt-10 grid gap-11 lg:grid-cols-2"><section><div className="flex items-center gap-2"><Receipt size={22} weight="fill" className="text-brand" /><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">Status iuran</h2></div><div className="mt-5 divide-y divide-line border-y border-line">{house.contributions.length ? house.contributions.map((item) => <div key={item.id} className="grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-bold text-ink">{item.category}</p><p className="mt-1 text-sm text-ink-muted">{item.period ? `Periode ${formatDate(item.period)}` : "Periode belum dicatat"}</p></div><div className="sm:text-right"><p className="font-bold text-ink">{formatRupiah(item.amount)}</p><p className="mt-1 text-xs font-bold text-brand-deep">{statusLabels[item.status] ?? item.status}</p></div></div>) : <p className="py-6 text-sm leading-6 text-ink-muted">Belum ada riwayat iuran yang diterbitkan untuk rumah ini.</p>}</div></section>
      <section><div className="flex items-center gap-2"><FileText size={22} weight="fill" className="text-brand" /><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">Riwayat surat</h2></div><div className="mt-5 divide-y divide-line border-y border-line">{house.documents.length ? house.documents.map((item) => <div key={item.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-ink">{documentLabels[item.type]}</p><p className="mt-1 text-sm text-ink-muted">Diajukan {formatDate(item.createdAt.slice(0, 10))}</p></div><p className="text-xs font-bold text-brand-deep">{statusLabels[item.status] ?? item.status}</p></div>{item.documentNumber ? <Link href={`/api/rumah/${token}/surat/${item.id}`} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-deep hover:text-brand">Unduh PDF {item.documentNumber}</Link> : null}</div>) : <p className="py-6 text-sm leading-6 text-ink-muted">Belum ada permohonan surat yang terhubung dengan rumah ini.</p>}</div></section></div>
    <section className="mt-12 border-t border-line pt-7"><div className="flex max-w-2xl gap-3"><LinkSimpleBreak size={22} weight="fill" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /><p className="text-sm leading-6 text-ink-muted">Perlu memperbarui data rumah? Gunakan pendataan warga baru dan sampaikan nomor referensi kepada RT agar perubahan dapat diperiksa.</p></div><Link href="/pendataan-warga" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-action px-5 text-sm font-bold text-on-action hover:-translate-y-0.5 hover:bg-brand hover:text-on-brand">Ajukan pembaruan data</Link></section>
  </div>;
}
