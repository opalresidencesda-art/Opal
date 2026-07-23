"use client";

import { CheckCircle, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useState } from "react";

export type LetterType = "move" | "domicile" | "single";
type Field = { name: string; label: string; hint?: string; type?: "text" | "email" | "tel" | "number"; defaultValue?: string | number; options?: string[]; span?: "full" };

const common: Field[] = [
  { name: "contactName", label: "Nama pemohon" },
  { name: "contactEmail", label: "Email pemohon", type: "email" },
  { name: "contactWhatsapp", label: "Nomor WhatsApp", type: "tel", hint: "Format: 08112345678" },
  { name: "gang", label: "Gang/Blok rumah", options: ["1", "2", "3", "5"] },
  { name: "houseNumber", label: "Nomor rumah", hint: "Contoh: 62" },
];

const typeConfig: Record<LetterType, { title: string; description: string; fields: Field[] }> = {
  move: { title: "Surat Keterangan Pindah Rumah", description: "Masukkan data sesuai surat sumber. RT akan memeriksa sebelum menerbitkan dokumen resmi.", fields: [
    { name: "fullName", label: "Nama lengkap" }, { name: "nik", label: "NIK", hint: "16 digit" }, { name: "kk", label: "Nomor KK", hint: "16 digit" }, { name: "gender", label: "Jenis kelamin", options: ["Laki-laki", "Perempuan"] },
    { name: "birthPlaceDate", label: "Tempat, tanggal lahir" }, { name: "religion", label: "Agama" }, { name: "citizenship", label: "Warga negara", defaultValue: "Indonesia" },
    { name: "oldAddress", label: "Alamat lama", span: "full" }, { name: "oldVillage", label: "Desa/Kelurahan lama" }, { name: "oldDistrict", label: "Kecamatan lama" }, { name: "oldRegency", label: "Kabupaten lama" }, { name: "oldProvince", label: "Provinsi lama" },
    { name: "newAddress", label: "Alamat baru", defaultValue: "Jl. Delima Selatan No. ", span: "full" }, { name: "newVillage", label: "Kelurahan baru", defaultValue: "Tambakrejo" }, { name: "newDistrict", label: "Kecamatan baru", defaultValue: "Waru" }, { name: "newRegency", label: "Kabupaten baru", defaultValue: "Sidoarjo" }, { name: "newProvince", label: "Provinsi baru", defaultValue: "Jawa Timur" },
    { name: "reason", label: "Alasan pindah", span: "full" }, { name: "followersCount", label: "Jumlah pengikut", type: "number", defaultValue: 0 },
  ] },
  domicile: { title: "Surat Keterangan Domisili", description: "Surat diterbitkan setelah RT memeriksa kesesuaian data dengan domisili OPAL.", fields: [
    { name: "fullName", label: "Nama" }, { name: "birthPlaceDate", label: "Tempat, tanggal lahir" }, { name: "gender", label: "Jenis kelamin", options: ["Laki-laki", "Perempuan"] }, { name: "occupation", label: "Pekerjaan" }, { name: "religion", label: "Agama" }, { name: "maritalStatus", label: "Status perkawinan" }, { name: "citizenship", label: "Kewarganegaraan", defaultValue: "Indonesia" }, { name: "address", label: "Alamat", defaultValue: "OPAL Residence, Tambakrejo, Waru, Sidoarjo", span: "full" },
  ] },
  single: { title: "Surat Keterangan Belum Menikah", description: "RT akan meninjau data sebelum surat resmi bernomor diterbitkan.", fields: [
    { name: "fullName", label: "Nama" }, { name: "nik", label: "Nomor KTP", hint: "16 digit" }, { name: "birthPlaceDate", label: "Tempat, tanggal lahir" }, { name: "gender", label: "Jenis kelamin", options: ["Laki-laki", "Perempuan"] }, { name: "religion", label: "Agama" }, { name: "occupation", label: "Pekerjaan" }, { name: "maritalStatus", label: "Status perkawinan", defaultValue: "Belum menikah" }, { name: "address", label: "Alamat domisili", defaultValue: "OPAL Residence, Tambakrejo, Waru, Sidoarjo", span: "full" },
  ] },
};

const inputClass = "mt-2 min-h-14 w-full rounded-lg border border-line bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-faint focus:border-brand focus:bg-surface-raised focus:ring-4 focus:ring-brand/15";

export function DocumentRequestForm({ type }: { type: LetterType }) {
  const config = typeConfig[type];
  const fields = [...common, ...config.fields];
  const fieldGroups = type === "move"
    ? [
      { title: "Kontak & rumah", fields: fields.slice(0, 5) },
      { title: "Identitas pemohon", fields: fields.slice(5, 12) },
      { title: "Alamat asal", fields: fields.slice(12, 17) },
      { title: "Tujuan pindah", fields: fields.slice(17, 22) },
      { title: "Keterangan pindah", fields: fields.slice(22) },
    ]
    : [
      { title: "Kontak & rumah", fields: fields.slice(0, 5) },
      { title: "Identitas pemohon", fields: fields.slice(5, -1) },
      { title: type === "domicile" ? "Alamat domisili" : "Alamat", fields: fields.slice(-1) },
    ];
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/surat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, values }) });
      const body = (await response.json()) as { error?: string; reference?: string; receiptEmailSent?: boolean };
      if (!response.ok) throw new Error(body.error ?? "Permohonan tidak dapat dikirim.");
      setStatus("success");
      setMessage(`Permohonan ${config.title} diterima. Nomor referensi: ${body.reference}.${body.receiptEmailSent ? " Tanda-terima aman telah dikirim ke email Anda." : " RT akan menghubungi Anda setelah pemeriksaan."}`);
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kendala saat mengirim permohonan.");
    }
  }

  return <form onSubmit={submit} aria-busy={status === "submitting"} className="rounded-[16px] border border-line bg-surface-raised p-5 sm:p-8">
    <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
    <h2 className="text-[1.65rem] font-bold tracking-[-0.05em] text-ink sm:text-3xl">{config.title}</h2>
    <p className="mt-3 max-w-2xl text-base leading-7 text-ink-muted">{config.description}</p>
    <div className="mt-5 border-l-4 border-brand bg-brand-soft/40 px-4 py-3 text-base leading-7 text-ink-muted">
      Semua kolom perlu diisi. Setelah dikirim, pengurus OPAL akan memeriksa data sebelum surat diterbitkan.
    </div>
    <div className="mt-8 grid gap-9">
      {fieldGroups.map((group) => (
        <fieldset key={group.title} className="border-t border-line pt-8 first:border-t-0 first:pt-0">
          <legend className="text-lg font-bold tracking-[-0.025em] text-ink">{group.title}</legend>
          <div className="mt-5 grid gap-x-6 gap-y-6 sm:grid-cols-2">
            {group.fields.map((field) => {
              const hintId = field.hint ? `${field.name}-hint` : undefined;

              return (
                <label key={field.name} className={field.span === "full" ? "block text-base font-bold leading-6 text-ink sm:col-span-2" : "block text-base font-bold leading-6 text-ink"}>
                  <span>{field.label}</span>
                  <span className="ml-2 text-sm font-semibold text-brand">Wajib diisi</span>
                  {field.hint ? <span id={hintId} className="mt-1.5 block text-[0.9375rem] font-normal leading-6 text-ink-muted">{field.hint}</span> : null}
                  {field.options ? (
                    <select name={field.name} defaultValue={field.defaultValue ?? ""} required aria-describedby={hintId} className={inputClass}>
                      <option value="">Pilih</option>
                      {field.options.map((option) => <option key={option} value={option}>{field.name === "gang" ? `Gang ${option}` : option}</option>)}
                    </select>
                  ) : (
                    <input name={field.name} type={field.type ?? "text"} defaultValue={field.defaultValue} required aria-describedby={hintId} className={inputClass} inputMode={field.name === "nik" || field.name === "kk" || field.name === "houseNumber" ? "numeric" : undefined} />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
    <p className="mt-8 max-w-2xl border-t border-line pt-6 text-base leading-7 text-ink-muted">Tidak ada unggahan KTP atau KK untuk layanan surat. RT memeriksa data sebelum menerbitkan nomor dan PDF resmi.</p>
    {status !== "idle" ? (
      <div className={`mt-6 flex items-start gap-3 border-l-4 px-4 py-4 text-base font-semibold leading-6 ${status === "success" ? "border-brand bg-brand-soft text-ink" : status === "error" ? "border-danger bg-danger-soft text-danger-deep" : "border-line bg-surface-subtle text-ink-muted"}`} role={status === "error" ? "alert" : "status"} aria-live="polite">
        {status === "success" ? <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> : status === "error" ? <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> : null}
        <span>{message || "Mengirim permohonan. Mohon tunggu."}</span>
      </div>
    ) : null}
    <button disabled={status === "submitting"} aria-disabled={status === "submitting"} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-action px-6 text-base font-bold text-on-action hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><PaperPlaneTilt size={20} weight="fill" aria-hidden="true" />{status === "submitting" ? "Mengirim permohonan..." : "Kirim permohonan"}</button>
  </form>;
}
