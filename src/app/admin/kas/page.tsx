import { ArrowDownLeft, ArrowUpRight, DownloadSimple, Funnel, MagnifyingGlass, Receipt, TrendUp } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCashTransactionEditor, type AdminCashTransaction } from "@/components/admin-cash-transaction-editor";
import { getAdminContext } from "@/lib/admin";
import { getAllCashTransactions } from "@/lib/cash";
import { formatRupiah } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ruang Kerja Kas | Admin OPAL" };

const PAGE_SIZE = 25;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function toText(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function pageHref(params: Record<string, string>, page: number) {
  const next = new URLSearchParams({ ...params, page: String(page) });
  return `/admin/kas?${next.toString()}`;
}

export default async function AdminKasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getAdminContext();
  if (context.kind === "signed-out") redirect("/admin/login");
  if (context.kind === "forbidden") redirect("/admin/login?reason=forbidden");
  if (context.kind === "setup") return <SetupState />;

  const supabase = await createSupabaseServerClient();
  const result = await getAllCashTransactions(supabase);
  if (result.error || !result.data) return <LoadError />;
  const transactions = result.data as AdminCashTransaction[];
  const params = await searchParams;
  const query = toText(params.q).trim().toLowerCase();
  const direction = toText(params.direction);
  const visibility = toText(params.visibility);
  const from = toText(params.from);
  const to = toText(params.to);
  const currentPage = Math.max(1, Number.parseInt(toText(params.page) || "1", 10) || 1);
  const filters = { q: toText(params.q), direction, visibility, from, to };
  const filtered = transactions.filter((transaction) => {
    const searchable = `${transaction.transaction_date} ${transaction.category} ${transaction.description}`.toLowerCase();
    return (!query || searchable.includes(query))
      && (!direction || transaction.direction === direction)
      && (!visibility || (visibility === "public" ? transaction.is_public : !transaction.is_public))
      && (!from || transaction.transaction_date >= from)
      && (!to || transaction.transaction_date <= to);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, pageCount);
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totals = transactions.reduce((sum, transaction) => ({
    income: sum.income + (transaction.direction === "income" ? transaction.amount_rupiah : 0),
    expense: sum.expense + (transaction.direction === "expense" ? transaction.amount_rupiah : 0),
  }), { income: 0, expense: 0 });
  const filteredTotals = filtered.reduce((sum, transaction) => ({
    income: sum.income + (transaction.direction === "income" ? transaction.amount_rupiah : 0),
    expense: sum.expense + (transaction.direction === "expense" ? transaction.amount_rupiah : 0),
  }), { income: 0, expense: 0 });
  const activeFilter = Boolean(query || direction || visibility || from || to);

  return <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
    <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div><Link href="/admin" className="text-sm font-extrabold text-brand-deep hover:text-brand">← Kembali ke ruang kerja RT</Link><div className="mt-6 flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep"><Receipt size={23} weight="fill" aria-hidden="true" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep">Buku Kas OPAL</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.065em] text-ink sm:text-4xl">Ruang kerja uang masuk dan keluar.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Satu sumber data untuk bendahara. Histori Excel tetap terbaca, transaksi baru dicatat di sini, dan ringkasan publik mengikuti transaksi yang ditandai tampil.</p></div></div></div>
      <div className="flex flex-wrap gap-2"><a href="/api/admin/kas/export" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-raised px-4 text-sm font-extrabold text-ink transition hover:border-brand hover:text-brand"><DownloadSimple size={18} weight="bold" aria-hidden="true" /> Ekspor CSV</a><a href="/kas" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-action px-4 text-sm font-extrabold text-on-action transition hover:bg-brand hover:text-on-brand">Lihat tampilan warga</a></div>
    </div>

    <section aria-labelledby="cash-summary-heading" className="mt-7 overflow-hidden rounded-[26px] border border-line bg-surface-raised shadow-[0_18px_55px_rgba(5,45,39,0.07)]"><h2 id="cash-summary-heading" className="sr-only">Ringkasan Kas</h2><div className="grid lg:grid-cols-[1.2fr_1fr]"><div className="bg-brand-soft/50 p-6 sm:p-8 lg:border-r"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep">Saldo berjalan</p><p className="mt-4 text-4xl font-extrabold tracking-[-0.08em] text-ink sm:text-5xl">{formatRupiah(totals.income - totals.expense)}</p><div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-brand/20 pt-5 text-sm"><span><span className="block text-xs font-bold text-ink-muted">Pemasukan</span><strong className="mt-1 block text-lg text-brand-deep">{formatRupiah(totals.income)}</strong></span><span><span className="block text-xs font-bold text-ink-muted">Pengeluaran</span><strong className="mt-1 block text-lg text-danger-deep">{formatRupiah(totals.expense)}</strong></span><span><span className="block text-xs font-bold text-ink-muted">Transaksi</span><strong className="mt-1 block text-lg text-ink">{transactions.length}</strong></span></div></div><div className="grid sm:grid-cols-2"><div className="border-b border-line p-6 sm:border-b-0 sm:border-r sm:p-8"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-deep"><TrendUp size={17} weight="bold" aria-hidden="true" /> Pemasukan</div><p className="mt-3 text-2xl font-extrabold tracking-[-0.06em] text-ink">{formatRupiah(totals.income)}</p><p className="mt-2 text-sm leading-6 text-ink-muted">Semua uang masuk yang tercatat di database.</p></div><div className="p-6 sm:p-8"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-danger-deep"><ArrowUpRight size={17} weight="bold" aria-hidden="true" /> Pengeluaran</div><p className="mt-3 text-2xl font-extrabold tracking-[-0.06em] text-ink">{formatRupiah(totals.expense)}</p><p className="mt-2 text-sm leading-6 text-ink-muted">Semua uang keluar yang sudah dicatat.</p></div></div></div></section>

    <section aria-labelledby="cash-entry-heading" className="mt-10 grid gap-8 xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)]"><div><div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep">Transaksi baru</p><h2 id="cash-entry-heading" className="mt-1 text-2xl font-extrabold tracking-[-0.055em] text-ink">Catat dengan bukti di tangan.</h2></div><AdminCashTransactionEditor returnTo="/admin/kas" /></div><div className="min-w-0"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep">Buku transaksi</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.055em] text-ink">Cari dan koreksi histori.</h2></div><p className="text-sm font-bold text-ink-muted">{filtered.length} dari {transactions.length} baris</p></div><form method="get" className="rounded-2xl border border-line bg-surface-subtle p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="relative sm:col-span-2 lg:col-span-1"><span className="sr-only">Cari transaksi</span><MagnifyingGlass size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" /><input name="q" defaultValue={toText(params.q)} placeholder="Cari kategori atau keterangan" className="min-h-11 w-full rounded-xl border border-line bg-surface-raised pl-10 pr-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15" /></label><label><span className="sr-only">Arah</span><select name="direction" defaultValue={direction} className="min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"><option value="">Semua arah</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></label><label><span className="sr-only">Visibilitas</span><select name="visibility" defaultValue={visibility} className="min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"><option value="">Semua visibilitas</option><option value="public">Tampil ke warga</option><option value="private">Privat</option></select></label><label><span className="sr-only">Dari tanggal</span><input name="from" type="date" defaultValue={from} className="min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15" /></label><label><span className="sr-only">Sampai tanggal</span><input name="to" type="date" defaultValue={to} className="min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3.5 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15" /></label><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action transition hover:bg-brand hover:text-on-brand"><Funnel size={17} weight="bold" aria-hidden="true" /> Terapkan filter</button></div></form>{activeFilter ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-l-2 border-brand bg-brand-soft/60 px-4 py-3 text-sm"><span className="font-bold text-brand-deep">Hasil filter: {formatRupiah(filteredTotals.income - filteredTotals.expense)} saldo dari {filtered.length} transaksi</span><Link href="/admin/kas" className="font-extrabold text-brand-deep hover:text-brand">Reset</Link></div> : null}<div className="mt-5 divide-y divide-line border-y border-line">{visibleRows.length ? visibleRows.map((transaction) => <article key={transaction.id} className="py-4"><details className="group"><summary className="grid cursor-pointer list-none gap-3 [&::-webkit-details-marker]:hidden sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div className="min-w-0"><p className="truncate font-extrabold text-ink">{transaction.category}</p><p className="mt-1 truncate text-sm text-ink-muted">{formatDate(transaction.transaction_date)}{transaction.description ? `, ${transaction.description}` : ""}</p></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${transaction.direction === "income" ? "bg-brand-soft text-brand-deep" : "bg-danger-soft text-danger-deep"}`}>{transaction.direction === "income" ? <ArrowDownLeft size={14} weight="bold" aria-hidden="true" /> : <ArrowUpRight size={14} weight="bold" aria-hidden="true" />}{transaction.direction === "income" ? "Masuk" : "Keluar"}</span><p className="text-lg font-extrabold tracking-[-0.04em] text-ink sm:text-right">{formatRupiah(transaction.amount_rupiah)}</p></summary><div className="mt-5"><AdminCashTransactionEditor transaction={transaction} returnTo="/admin/kas" /></div></details></article>) : <p className="py-10 text-center text-sm leading-6 text-ink-muted">Tidak ada transaksi yang cocok dengan filter ini.</p>}</div>{pageCount > 1 ? <nav aria-label="Halaman buku Kas" className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-bold text-ink-muted">Halaman {page} dari {pageCount}</p><div className="flex gap-2">{page > 1 ? <Link href={pageHref(filters, page - 1)} className="inline-flex min-h-10 items-center rounded-xl border border-line px-3.5 text-sm font-extrabold text-ink hover:border-brand hover:text-brand">Sebelumnya</Link> : null}{page < pageCount ? <Link href={pageHref(filters, page + 1)} className="inline-flex min-h-10 items-center rounded-xl bg-action px-3.5 text-sm font-extrabold text-on-action hover:bg-brand hover:text-on-brand">Berikutnya</Link> : null}</div></nav> : null}</div></section>
  </main>;
}

function SetupState() {
  return <main className="mx-auto flex min-h-[58vh] max-w-3xl items-center px-5 py-14"><div className="border-l-2 border-brand bg-surface-subtle px-6 py-7 sm:px-8"><p className="text-sm font-extrabold text-brand-deep">Pengaturan diperlukan</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.06em] text-ink">Supabase belum terhubung.</h1><p className="mt-3 leading-7 text-ink-muted">Tambahkan konfigurasi Supabase, terapkan schema, lalu daftarkan akun RT sebelum membuka ruang kerja Kas.</p></div></main>;
}

function LoadError() {
  return <main className="mx-auto max-w-3xl px-5 py-16"><div className="border-l-2 border-danger bg-danger-soft px-6 py-7"><p className="text-sm font-extrabold text-danger-deep">Kas gagal dimuat</p><h1 className="mt-2 text-2xl font-extrabold text-ink">Jangan menganggap data kosong sebagai saldo nol.</h1><p className="mt-3 text-sm leading-6 text-danger-deep">Periksa koneksi atau schema Supabase, lalu muat ulang halaman.</p></div></main>;
}
