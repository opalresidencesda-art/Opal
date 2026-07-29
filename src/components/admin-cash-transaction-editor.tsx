import { ArrowDownLeft, ArrowUpRight, CheckCircle, Receipt } from "@phosphor-icons/react/dist/ssr";
import { saveCashTransaction } from "@/app/admin/actions";
import type { CashTransactionData } from "@/lib/cash";

export type AdminCashTransaction = CashTransactionData & { id: string };

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15";
const textareaClass = "mt-2 min-h-24 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-extrabold text-ink"><span className="flex items-baseline justify-between gap-3"><span>{label}</span>{hint ? <span className="text-[11px] font-semibold text-ink-faint">{hint}</span> : null}</span>{children}</label>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-bold text-ink"><input name={name} type="checkbox" defaultChecked={checked} className="size-4 accent-brand" /> <span>{label}</span></label>;
}

function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function AdminCashTransactionEditor({ transaction, returnTo = "/admin" }: { transaction?: AdminCashTransaction; returnTo?: string }) {
  const isEditing = Boolean(transaction);
  const direction = transaction?.direction ?? "income";
  return <form action={saveCashTransaction} className="overflow-hidden rounded-[22px] border border-line bg-surface-raised shadow-[0_18px_55px_rgba(5,45,39,0.08)]">
    <input type="hidden" name="id" value={transaction?.id ?? ""} /><input type="hidden" name="returnTo" value={returnTo} />
    <div className="border-b border-line bg-surface-subtle px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${direction === "income" ? "bg-brand-soft text-brand-deep" : "bg-danger-soft text-danger-deep"}`} aria-hidden="true">{direction === "income" ? <ArrowDownLeft size={21} weight="bold" /> : <ArrowUpRight size={21} weight="bold" />}</span>
        <div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-deep">{isEditing ? "Koreksi transaksi" : "Catat transaksi"}</p><h3 className="mt-1 text-xl font-extrabold tracking-[-0.045em] text-ink">{isEditing ? "Perbarui dengan bukti yang sama" : "Masukkan uang masuk atau keluar"}</h3><p className="mt-1.5 max-w-xl text-sm leading-6 text-ink-muted">{isEditing ? "Versi sebelumnya disimpan sebagai riwayat audit sebelum koreksi diterapkan." : "Satu transaksi per bukti. Data yang ditandai publik ikut membentuk ringkasan warga."}</p></div>
      </div>
    </div>
    <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
      <Field label="Tanggal transaksi"><input name="transactionDate" type="date" defaultValue={transaction?.transaction_date ?? todayJakarta()} required className={inputClass} /></Field>
      <Field label="Arah transaksi"><select name="direction" defaultValue={direction} className={inputClass}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></Field>
      <Field label="Kategori" hint="Wajib"><input name="category" defaultValue={transaction?.category ?? ""} placeholder="Iuran warga, CCTV, bank..." required maxLength={120} className={inputClass} /></Field>
      <Field label="Nominal (rupiah)" hint="Tanpa titik/koma"><input name="amountRupiah" type="number" min="1" max="1000000000" step="1" defaultValue={transaction?.amount_rupiah ?? ""} placeholder="25000" required className={inputClass} /></Field>
      <div className="sm:col-span-2"><Field label="Keterangan" hint="Opsional"><textarea name="description" defaultValue={transaction?.description ?? ""} maxLength={500} placeholder="Contoh: Iuran OP 1 - 05, Juni 2026" className={textareaClass} /></Field></div>
      <div className="sm:col-span-2 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"><Toggle name="isPublic" label="Tampilkan di ringkasan warga" checked={transaction?.is_public ?? true} /><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-action px-5 text-sm font-extrabold text-on-action transition hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/30">{isEditing ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : <Receipt size={18} weight="fill" aria-hidden="true" />}{isEditing ? "Simpan koreksi" : "Simpan transaksi"}</button></div>
    </div>
  </form>;
}
