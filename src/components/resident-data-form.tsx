"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, FileImage, LockKey, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { createClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { residentSubmissionSchema, type ResidentSubmissionFormInput, type ResidentSubmissionInput } from "@/lib/validation";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[0.95rem] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:ring-3 focus:ring-brand/15";
const fieldsetClass = "border-t border-line pt-8 first:border-t-0 first:pt-0";
const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type UploadItem = { key: string; file: File };
type PrepareResponse = { submissionId: string; unitCode: string; uploads: Array<{ key: string; path: string; token: string }> };

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-ink"><span>{label}</span>{hint ? <span className="mt-1.5 block text-sm font-normal leading-6 text-ink-muted">{hint}</span> : null}{children}{error ? <span className="mt-1.5 block text-sm font-semibold text-[#a53928]">{error}</span> : null}</label>;
}

function FileField({ label, hint, multiple, onFiles, error }: { label: string; hint: string; multiple?: boolean; onFiles: (files: File[]) => void; error?: string }) {
  return <Field label={label} hint={hint} error={error}>
    <span className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-4 text-center transition hover:border-brand hover:bg-brand-soft/30">
      <FileImage size={25} weight="duotone" className="text-brand" aria-hidden="true" />
      <span className="mt-2 text-sm font-bold text-ink">Pilih {multiple ? "beberapa foto" : "foto"}</span>
      <span className="mt-1 text-xs leading-5 text-ink-muted">JPG, PNG, WEBP, HEIC atau HEIF, maksimal 10 MB per foto</span>
      <input className="sr-only" type="file" accept={allowedImages.join(",")} multiple={multiple} onChange={(event) => onFiles(Array.from(event.target.files ?? []))} />
    </span>
  </Field>;
}

export function ResidentDataForm() {
  const form = useForm<ResidentSubmissionFormInput, unknown, ResidentSubmissionInput>({
    resolver: zodResolver(residentSubmissionSchema),
    defaultValues: { houseStatus: "self", headOfHouseholdOccupation: "employee", occupantsCount: 1, environmentFeedback: "", managementFeedback: "", website: "" },
  });
  const [responsibleKtp, setResponsibleKtp] = useState<File | null>(null);
  const [occupantKtps, setOccupantKtps] = useState<File[]>([]);
  const [familyCard, setFamilyCard] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const fileSummary = useMemo(() => [responsibleKtp, ...occupantKtps, familyCard].filter(Boolean) as File[], [responsibleKtp, occupantKtps, familyCard]);

  function validateFiles() {
    if (!responsibleKtp || !familyCard || occupantKtps.length < 1 || occupantKtps.length > 10) return "KTP penanggung jawab, minimal satu KTP penghuni, dan KK wajib diunggah.";
    if (fileSummary.some((file) => !allowedImages.includes(file.type) || file.size > 10 * 1024 * 1024)) return "Setiap berkas harus berupa gambar yang didukung dan maksimal 10 MB.";
    return "";
  }

  async function submit(values: ResidentSubmissionInput) {
    const fileError = validateFiles();
    if (fileError) {
      setUploadError(fileError);
      return;
    }
    setUploadError("");
    setStatus("submitting");
    setMessage("");
    const uploads: UploadItem[] = [
      { key: "responsibleKtp", file: responsibleKtp! },
      ...occupantKtps.map((file, index) => ({ key: `occupantKtp-${index + 1}`, file })),
      { key: "familyCard", file: familyCard! },
    ];

    try {
      const prepare = await fetch("/api/pendataan-warga/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ values, files: uploads.map(({ key, file }) => ({ key, name: file.name, type: file.type, size: file.size })) }),
      });
      const prepared = (await prepare.json()) as PrepareResponse & { error?: string };
      if (!prepare.ok) throw new Error(prepared.error ?? "Permohonan tidak dapat disiapkan.");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("Penyimpanan privat belum dikonfigurasi.");
      const storage = createClient(url, key, { auth: { persistSession: false } }).storage.from("resident-evidence");
      const uploaded = await Promise.all(uploads.map(async ({ key: uploadKey, file }) => {
        const target = prepared.uploads.find((item) => item.key === uploadKey);
        if (!target) throw new Error("Tujuan unggahan tidak ditemukan.");
        const { error } = await storage.uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
        if (error) throw new Error("Salah satu berkas tidak dapat diunggah.");
        return { key: uploadKey, path: target.path, name: file.name, type: file.type, size: file.size };
      }));
      const complete = await fetch("/api/pendataan-warga/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ submissionId: prepared.submissionId, files: uploaded }) });
      const completed = (await complete.json()) as { error?: string; reference?: string; receiptEmailSent?: boolean };
      if (!complete.ok) throw new Error(completed.error ?? "Unggahan tidak dapat diselesaikan.");
      setStatus("success");
      setMessage(`Data untuk ${prepared.unitCode} telah diterima. Nomor referensi: ${completed.reference}.${completed.receiptEmailSent ? " Tanda-terima aman telah dikirim ke email Anda." : " Simpan nomor referensi ini; pengurus akan menghubungi Anda bila diperlukan."}`);
      form.reset();
      setResponsibleKtp(null);
      setOccupantKtps([]);
      setFamilyCard(null);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Terjadi kendala saat mengirim formulir.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-9" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" {...form.register("website")} />
      <fieldset className={fieldsetClass}>
        <legend className="text-xl font-extrabold tracking-[-0.045em] text-ink">Rumah yang didata</legend>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Satu pengisian hanya untuk satu rumah. Jika Anda bertanggung jawab atas beberapa rumah, isi formulir ini untuk masing-masing rumah.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Email" error={form.formState.errors.email?.message}><input type="email" autoComplete="email" className={inputClass} {...form.register("email")} /></Field>
          <Field label="Gang/Blok Rumah" error={form.formState.errors.gang?.message}><select className={inputClass} {...form.register("gang")}><option value="">Pilih gang</option><option value="1">Gang 1 (Satu)</option><option value="2">Gang 2 (Dua)</option><option value="3">Gang 3 (Tiga)</option><option value="5">Gang 5 (Lima)</option></select></Field>
          <Field label="Nomor Rumah" hint="Contoh: 62" error={form.formState.errors.houseNumber?.message}><input className={inputClass} inputMode="numeric" {...form.register("houseNumber")} /></Field>
          <Field label="Status Rumah di OPAL" error={form.formState.errors.houseStatus?.message}><select className={inputClass} {...form.register("houseStatus")}><option value="self">Terisi, dihuni sendiri</option><option value="relative">Terisi, dihuni kerabat</option><option value="tenant">Terisi, dihuni penyewa</option><option value="vacant_rent">Kosong, disewakan</option><option value="vacant_sale">Kosong, dijual</option></select></Field>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-xl font-extrabold tracking-[-0.045em] text-ink">Penanggung jawab rumah</legend>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Penanggung jawab adalah pemilik rumah secara legal, bukan penyewa maupun kerabat pemilik.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Nama lengkap penanggung jawab" error={form.formState.errors.responsibleName?.message}><input autoComplete="name" className={inputClass} {...form.register("responsibleName")} /></Field>
          <Field label="Nomor WhatsApp" hint="Format: 08112345678" error={form.formState.errors.whatsapp?.message}><input inputMode="tel" autoComplete="tel" className={inputClass} {...form.register("whatsapp")} /></Field>
          <div className="sm:col-span-2"><Field label="Alamat penanggung jawab" hint="Isi alamat lengkap. Bila domisili tetap berada di OPAL, tulis alamat OPAL Residence." error={form.formState.errors.responsibleAddress?.message}><textarea className={`${inputClass} min-h-28 py-3`} {...form.register("responsibleAddress")} /></Field></div>
          <div className="sm:col-span-2"><FileField label="KTP Penanggung Jawab" hint="KTP pemilik rumah yang resmi secara legalitas." onFiles={(files) => setResponsibleKtp(files[0] ?? null)} error={!responsibleKtp && uploadError ? "KTP penanggung jawab belum dipilih." : undefined} />{responsibleKtp ? <p className="mt-2 text-sm font-semibold text-brand-deep">{responsibleKtp.name}</p> : null}</div>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-xl font-extrabold tracking-[-0.045em] text-ink">Data umum penghuni rumah</legend>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">Cantumkan seluruh penghuni tetap, termasuk asisten rumah tangga bila ada.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Nama Kepala Keluarga" error={form.formState.errors.headOfHouseholdName?.message}><input className={inputClass} {...form.register("headOfHouseholdName")} /></Field>
          <Field label="Pekerjaan Kepala Keluarga" error={form.formState.errors.headOfHouseholdOccupation?.message}><select className={inputClass} {...form.register("headOfHouseholdOccupation")}><option value="employee">Pegawai</option><option value="entrepreneur">Wiraswasta</option><option value="student">Pelajar</option></select></Field>
          <Field label="Jumlah Penghuni Rumah" hint="Termasuk asisten rumah tangga bila ada." error={form.formState.errors.occupantsCount?.message}><input type="number" min="1" max="30" className={inputClass} {...form.register("occupantsCount")} /></Field>
          <div className="sm:col-span-2"><FileField label="KTP Seluruh Penghuni" hint="Unggah KTP seluruh penghuni. Unggah ulang KTP penanggung jawab bila ikut menghuni. Maksimal 10 foto." multiple onFiles={(files) => setOccupantKtps(files.slice(0, 10))} error={occupantKtps.length === 0 && uploadError ? "Minimal satu KTP penghuni wajib diunggah." : undefined} />{occupantKtps.length ? <p className="mt-2 text-sm font-semibold text-brand-deep">{occupantKtps.length} foto KTP siap diunggah</p> : null}</div>
          <div className="sm:col-span-2"><FileField label="Kartu Keluarga (KK)" hint="Unggah dalam bentuk gambar, misalnya PNG atau JPG; bukan PDF atau DOCX." onFiles={(files) => setFamilyCard(files[0] ?? null)} error={!familyCard && uploadError ? "Kartu Keluarga belum dipilih." : undefined} />{familyCard ? <p className="mt-2 text-sm font-semibold text-brand-deep">{familyCard.name}</p> : null}</div>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-xl font-extrabold tracking-[-0.045em] text-ink">Feedback OPAL</legend>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Feedback untuk Lingkungan OPAL"><textarea className={`${inputClass} min-h-32 py-3`} {...form.register("environmentFeedback")} /></Field>
          <Field label="Feedback untuk Pengurus"><textarea className={`${inputClass} min-h-32 py-3`} {...form.register("managementFeedback")} /></Field>
        </div>
      </fieldset>

      <div className="border-t border-line pt-7">
        <div className="flex max-w-3xl gap-3 text-sm leading-6 text-ink-muted"><LockKey size={21} className="mt-0.5 shrink-0 text-brand" weight="fill" aria-hidden="true" /><p>Periksa kembali KTP dan KK sebelum mengirim. Berkas disimpan privat untuk pengurus OPAL dan tidak pernah ditampilkan di halaman publik. Bila ada kesalahan unggahan, hubungi pengurus RT untuk penghapusan data.</p></div>
        {status !== "idle" ? <p className={`mt-5 flex gap-2 border-l-2 px-4 py-3 text-sm font-semibold ${status === "success" ? "border-brand bg-brand-soft text-ink" : status === "error" ? "border-[#a53928] bg-[#f7e4e0] text-[#6d1f15]" : "border-line bg-surface-subtle text-ink-muted"}`} role="status">{status === "success" ? <CheckCircle size={20} weight="fill" aria-hidden="true" /> : status === "error" ? <WarningCircle size={20} weight="fill" aria-hidden="true" /> : null}{message || "Menyiapkan pengiriman aman..."}</p> : null}
        <button disabled={status === "submitting"} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />{status === "submitting" ? "Mengirim dengan aman..." : "Kirim data warga"}</button>
      </div>
    </form>
  );
}
