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

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[0.95rem] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15";

export function DocumentRequestForm({ type }: { type: LetterType }) {
  const config = typeConfig[type];
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

  return <form onSubmit={submit} className="border-t border-line pt-8" noValidate>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
    <h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">{config.title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">{config.description}</p>
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      {[...common, ...config.fields].map((field) => <label key={field.name} className={field.span === "full" ? "block text-sm font-bold text-ink sm:col-span-2" : "block text-sm font-bold text-ink"}>{field.label}{field.hint ? <span className="mt-1.5 block text-sm font-normal leading-6 text-ink-muted">{field.hint}</span> : null}{field.options ? <select name={field.name} defaultValue={field.defaultValue ?? ""} required className={inputClass}><option value="">Pilih</option>{field.options.map((option) => <option key={option} value={option}>{field.name === "gang" ? `Gang ${option}` : option}</option>)}</select> : <input name={field.name} type={field.type ?? "text"} defaultValue={field.defaultValue} required className={inputClass} inputMode={field.name === "nik" || field.name === "kk" || field.name === "houseNumber" ? "numeric" : undefined} />}</label>)}
    </div>
    <p className="mt-6 max-w-2xl text-sm leading-6 text-ink-muted">Tidak ada unggahan KTP atau KK untuk layanan surat. RT memeriksa data sebelum menerbitkan nomor dan PDF resmi.</p>
    {status !== "idle" ? <p className={`mt-5 flex gap-2 border-l-2 px-4 py-3 text-sm font-semibold ${status === "success" ? "border-brand bg-brand-soft text-ink" : status === "error" ? "border-[#a53928] bg-[#f7e4e0] text-[#6d1f15]" : "border-line bg-surface-subtle text-ink-muted"}`} role="status">{status === "success" ? <CheckCircle size={20} weight="fill" aria-hidden="true" /> : status === "error" ? <WarningCircle size={20} weight="fill" aria-hidden="true" /> : null}{message || "Mengirim permohonan..."}</p> : null}
    <button disabled={status === "submitting"} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />{status === "submitting" ? "Mengirim..." : "Kirim permohonan"}</button>
  </form>;
}
