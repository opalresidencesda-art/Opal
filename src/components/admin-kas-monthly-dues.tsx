import { CalendarBlank, CheckCircle, ClockCountdown, Receipt, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { prepareKasMonthlyContributions, updateKasContributionStatus } from "@/app/admin/actions";
import { formatRupiah } from "@/lib/format";
import type { MonthlyDuesRow, MonthlyDuesStatus } from "@/lib/monthly-dues";

type DuesView = "all" | "attention" | "paid" | "unprepared";

type MonthlyDuesSummary = {
  paid: number;
  pending: number;
  waived: number;
  unprepared: number;
  attention: number;
  outstandingHomes: number;
  outstandingAmount: number;
};

const statusMeta: Record<MonthlyDuesStatus, { label: string; className: string }> = {
  paid: { label: "Tercatat bayar", className: "bg-brand-soft text-brand-deep" },
  pending: { label: "Belum bayar", className: "bg-warm text-ink" },
  waived: { label: "Dibebaskan", className: "bg-surface-subtle text-ink-muted" },
  unprepared: { label: "Belum disiapkan", className: "bg-surface-subtle text-ink-muted" },
  attention: { label: "Perlu cek", className: "bg-danger-soft text-danger-deep" },
};

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}-01T12:00:00+07:00`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${value}T12:00:00+07:00`));
}

function jakartaDate() {
  const values = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" }).formatToParts(new Date());
  const year = values.find((value) => value.type === "year")?.value;
  const month = values.find((value) => value.type === "month")?.value;
  const day = values.find((value) => value.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function isVisible(row: MonthlyDuesRow, view: DuesView) {
  if (view === "attention") return row.selectedStatus === "pending" || row.selectedStatus === "attention";
  if (view === "paid") return row.selectedStatus === "paid" || row.selectedStatus === "waived";
  if (view === "unprepared") return row.selectedStatus === "unprepared";
  return true;
}

function StatusBadge({ status }: { status: MonthlyDuesStatus }) {
  const meta = statusMeta[status];
  return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${meta.className}`}>{meta.label}</span>;
}

function PaymentActions({ row, returnTo }: { row: MonthlyDuesRow; returnTo: string }) {
  const contribution = row.selectedContribution;
  if (!contribution) {
    return row.selectedStatus === "attention"
      ? <p className="text-xs font-bold leading-5 text-danger-deep">Ada lebih dari satu catatan untuk periode ini. Periksa data lama sebelum menandai pembayaran.</p>
      : null;
  }

  if (contribution.status === "pending") {
    return <form action={updateKasContributionStatus} className="grid gap-2 sm:grid-cols-[minmax(9rem,1fr)_auto] sm:items-end">
      <input type="hidden" name="id" value={contribution.id} />
      <input type="hidden" name="status" value="paid" />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="text-xs font-bold text-ink-muted">Tanggal diterima<input name="paidAt" type="date" defaultValue={jakartaDate()} required className="mt-1 block min-h-10 w-full rounded-lg border border-line bg-surface-raised px-3 text-sm font-bold text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15" /></label>
      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-action px-3.5 text-sm font-extrabold text-on-action transition hover:bg-brand hover:text-on-brand"><CheckCircle size={17} weight="fill" aria-hidden="true" /> Catat bayar</button>
    </form>;
  }

  return <form action={updateKasContributionStatus} className="mt-1">
    <input type="hidden" name="id" value={contribution.id} />
    <input type="hidden" name="status" value="pending" />
    <input type="hidden" name="returnTo" value={returnTo} />
    <button className="text-xs font-extrabold text-ink-muted underline decoration-line underline-offset-4 transition hover:text-danger-deep">Koreksi menjadi belum bayar</button>
  </form>;
}

export function AdminKasMonthlyDues({ periodMonth, view, rows, summary, activeFeeAmount, currentPeriod, loadError }: {
  periodMonth: string;
  view: DuesView;
  rows: MonthlyDuesRow[];
  summary: MonthlyDuesSummary;
  activeFeeAmount: number | null;
  currentPeriod: string;
  loadError: boolean;
}) {
  const visibleRows = rows.filter((row) => isVisible(row, view));
  const returnTo = `/admin/kas?iuranPeriod=${encodeURIComponent(periodMonth)}&iuranView=${view}#iuran-bulanan`;
  const currentMonth = periodMonth === currentPeriod;

  return <section id="iuran-bulanan" aria-labelledby="monthly-dues-heading" className="mt-10 scroll-mt-6 border-y border-line py-7 sm:py-8">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep"><Receipt size={17} weight="fill" aria-hidden="true" /> Iuran bulanan</div><h2 id="monthly-dues-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.055em] text-ink sm:text-3xl">Iuran Kas OPAL per rumah.</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Pantau rumah yang belum bayar, pembayaran terakhir, dan tunggakan yang sudah tercatat untuk setiap periode.</p></div>
      <form method="get" className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_minmax(11rem,1fr)_auto] sm:items-end"><label className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-muted">Periode<input name="iuranPeriod" type="month" defaultValue={periodMonth} className="mt-1.5 block min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15" /></label><label className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-muted">Tampilan<select name="iuranView" defaultValue={view} className="mt-1.5 block min-h-11 w-full rounded-xl border border-line bg-surface-raised px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"><option value="all">Semua rumah</option><option value="attention">Belum bayar & perlu cek</option><option value="unprepared">Belum disiapkan</option><option value="paid">Tercatat bayar</option></select></label><button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-surface-raised px-4 text-sm font-extrabold text-ink transition hover:border-brand hover:text-brand">Tampilkan</button></form>
    </div>

    {loadError ? <div className="mt-6 flex items-start gap-3 border-l-2 border-danger bg-danger-soft px-4 py-4 text-sm leading-6 text-danger-deep" role="alert"><WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /><p><strong className="font-extrabold">Data iuran belum dapat dimuat.</strong> Jangan menganggap daftar ini kosong atau lunas. Periksa koneksi dan schema Supabase, lalu muat ulang.</p></div> : <>
      <div className="mt-7 grid border-y border-line sm:grid-cols-2 lg:grid-cols-4"><div className="border-b border-line py-4 sm:border-b-0 sm:pr-5"><dt className="text-sm font-bold text-ink-muted">Belum bayar</dt><dd className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-ink">{summary.pending}</dd></div><div className="border-b border-line py-4 sm:border-b-0 sm:border-l sm:px-5"><dt className="text-sm font-bold text-ink-muted">Belum disiapkan</dt><dd className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-ink">{summary.unprepared}</dd></div><div className="border-b border-line py-4 sm:border-b-0 sm:border-l sm:px-5"><dt className="text-sm font-bold text-ink-muted">Tercatat bayar</dt><dd className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-ink">{summary.paid + summary.waived}</dd></div><div className="py-4 sm:border-l sm:pl-5"><dt className="text-sm font-bold text-ink-muted">Tunggakan tercatat</dt><dd className="mt-1 text-xl font-extrabold tracking-[-0.05em] text-ink">{formatRupiah(summary.outstandingAmount)}</dd><p className="mt-1 text-xs font-bold text-ink-muted">{summary.outstandingHomes} rumah</p></div></div>

      <div className="mt-6 flex flex-col gap-4 border-l-2 border-brand bg-brand-soft/45 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-brand-deep">Tarif aktif: {activeFeeAmount ? formatRupiah(activeFeeAmount) : "belum tersedia"}</p><p className="mt-1 text-sm leading-6 text-ink-muted">Menyiapkan tagihan tidak mencatat uang masuk ke Buku Kas. Catat penerimaan kas berdasarkan bukti pembayaran.</p></div>{currentMonth && activeFeeAmount ? <form action={prepareKasMonthlyContributions}><input type="hidden" name="periodMonth" value={periodMonth} /><input type="hidden" name="returnTo" value={returnTo} /><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action px-4 text-sm font-extrabold text-on-action transition hover:bg-brand hover:text-on-brand"><CalendarBlank size={18} weight="fill" aria-hidden="true" /> Siapkan tagihan {formatMonth(periodMonth)}</button></form> : <p className="max-w-sm text-sm font-bold leading-6 text-ink-muted">{currentMonth ? "Aktifkan tarif Iuran Kas OPAL terlebih dahulu." : "Tagihan bulan lampau tidak dibuat massal agar tidak mengarang kewajiban sebelum data tersedia."}</p>}</div>

      <div className="mt-7"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Status rumah</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Periode {formatMonth(periodMonth)}. “Belum disiapkan” bukan tunggakan.</p></div><p className="text-sm font-bold text-ink-muted">{visibleRows.length} dari {rows.length} rumah</p></div>{visibleRows.length ? <div className="mt-4 divide-y divide-line border-y border-line">{visibleRows.map((row) => <article key={row.id} className="py-5"><div className="grid gap-4 lg:grid-cols-[minmax(11rem,0.8fr)_minmax(11rem,0.9fr)_minmax(14rem,1fr)_minmax(12rem,0.9fr)] lg:items-start"><div><p className="font-extrabold text-ink">{row.unitCode}</p><p className="mt-1 text-sm text-ink-muted">{row.responsibleName || "Penanggung jawab belum diisi"}</p></div><div><StatusBadge status={row.selectedStatus} /><p className="mt-2 text-sm font-bold text-ink">{row.selectedContribution ? formatRupiah(row.selectedContribution.amountRupiah) : row.selectedStatus === "unprepared" ? "Belum ada tagihan" : "Periksa catatan"}</p>{row.selectedContribution?.status === "paid" && row.selectedContribution.paidAt ? <p className="mt-1 text-xs font-bold text-ink-muted">Diterima {formatDate(row.selectedContribution.paidAt)}</p> : null}</div><div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-muted">Riwayat</p><p className="mt-1 text-sm font-bold leading-6 text-ink">{row.lastPaidPeriod ? `Bayar terakhir ${formatMonth(row.lastPaidPeriod)}` : "Belum ada pembayaran tercatat"}</p><p className="mt-1 text-xs leading-5 text-ink-muted">{row.outstandingAmount ? `${row.outstandingPeriods.length} periode tertunggak tercatat` : "Tidak ada tunggakan tercatat"}</p></div><div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-muted">Sisa tercatat</p><p className="mt-1 text-lg font-extrabold tracking-[-0.035em] text-ink">{formatRupiah(row.outstandingAmount)}</p><div className="mt-3"><PaymentActions row={row} returnTo={returnTo} /></div></div></div></article>)}</div> : <div className="mt-4 border-l-2 border-line bg-surface-subtle px-4 py-5 text-sm leading-6 text-ink-muted">Tidak ada rumah yang cocok dengan tampilan ini.</div>}</div>
    </>}
  </section>;
}
