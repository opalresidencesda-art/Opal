"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, FileImage, LockKey, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { createClient } from "@supabase/supabase-js";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { residentSubmissionSchema, type ResidentSubmissionFormInput, type ResidentSubmissionInput } from "@/lib/validation";

const inputClass = "mt-2 min-h-14 w-full rounded-lg border border-line bg-surface px-4 text-base text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-ink-faint focus:border-brand focus:bg-surface-raised focus:ring-4 focus:ring-brand/15";
const fieldsetClass = "border-t border-line pt-9 first:border-t-0 first:pt-0";
const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

type UploadItem = { key: string; file: File };
type PrepareResponse = { submissionId: string; unitCode: string; uploads: Array<{ key: string; path: string; token: string }> };

function fieldMetadata(id: string, hasHint: boolean, hasError: boolean, required = false) {
  const describedBy = [hasHint ? `${id}-hint` : "", hasError ? `${id}-error` : ""].filter(Boolean).join(" ");

  return {
    id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": hasError || undefined,
    "aria-required": required || undefined,
  };
}

function Field({ id, label, hint, error, children, required, optional }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-base font-bold leading-6 text-ink">
      <span>{label}</span>
      {required ? <span className="ml-2 text-sm font-semibold text-brand">Wajib diisi</span> : null}
      {optional ? <span className="ml-2 text-sm font-semibold text-ink-muted">Opsional</span> : null}
      {hint ? <span id={`${id}-hint`} className="mt-1.5 block text-[0.9375rem] font-normal leading-6 text-ink-muted">{hint}</span> : null}
      {children}
      {error ? <span id={`${id}-error`} className="mt-2 flex items-start gap-2 text-[0.9375rem] font-semibold leading-6 text-danger"><WarningCircle size={19} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" />{error}</span> : null}
    </label>
  );
}

function FileField({ id, label, hint, multiple, onFiles, error }: { id: string; label: string; hint: string; multiple?: boolean; onFiles: (files: File[]) => void; error?: string }) {
  return <Field id={id} label={label} hint={hint} error={error} required>
    <span className="mt-3 block rounded-lg border border-dashed border-line bg-surface px-4 py-4 transition-colors hover:border-brand hover:bg-brand-soft/30">
      <span className="flex items-start gap-3">
        <FileImage size={26} weight="duotone" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <span>
          <span className="block font-bold text-ink">{multiple ? "Pilih hingga 10 foto KTP" : "Pilih satu foto"}</span>
          <span className="mt-1 block text-[0.9375rem] font-normal leading-6 text-ink-muted">JPG, PNG, WEBP, HEIC, atau HEIF. Maksimal 10 MB per foto.</span>
        </span>
      </span>
      <input className="mt-4 block w-full cursor-pointer text-[0.9375rem] font-normal text-ink file:mr-3 file:min-h-12 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand file:px-4 file:text-base file:font-bold file:text-on-brand hover:file:bg-brand-deep focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/15" type="file" accept={allowedImages.join(",")} multiple={multiple} {...fieldMetadata(id, true, Boolean(error), true)} onChange={(event) => onFiles(Array.from(event.target.files ?? []))} />
    </span>
  </Field>;
}

function UploadSummary({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 flex items-start gap-2 rounded-lg bg-brand-soft/45 px-3 py-2.5 text-[0.9375rem] font-semibold leading-6 text-brand-deep"><CheckCircle size={19} weight="fill" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /><span className="break-all">{children}</span></p>;
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
      toast.error("Berkas belum lengkap", { description: fileError });
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
    const toastId = toast.loading("Mengirim data secara aman...");

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
      const successMessage = `Data untuk ${prepared.unitCode} telah diterima. Nomor referensi: ${completed.reference}.${completed.receiptEmailSent ? " Tanda-terima aman telah dikirim ke email Anda." : " Simpan nomor referensi ini; pengurus akan menghubungi Anda bila diperlukan."}`;
      setStatus("success");
      setMessage(successMessage);
      toast.success("Data warga berhasil dikirim", { id: toastId, description: `Referensi ${completed.reference}` });
      form.reset();
      setResponsibleKtp(null);
      setOccupantKtps([]);
      setFamilyCard(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kendala saat mengirim formulir.";
      setStatus("error");
      setMessage(errorMessage);
      toast.error("Pengiriman belum berhasil", { id: toastId, description: errorMessage });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} aria-busy={status === "submitting"} className="grid gap-10" noValidate>
      <input type="text" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" {...form.register("website")} />
      <fieldset className={fieldsetClass}>
        <legend className="text-[1.4rem] font-bold tracking-[-0.045em] text-ink">Rumah yang didata</legend>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">Satu pengisian hanya untuk satu rumah. Jika Anda bertanggung jawab atas beberapa rumah, isi formulir ini untuk masing-masing rumah.</p>
        <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field id="resident-email" label="Email" required error={form.formState.errors.email?.message}><input type="email" autoComplete="email" className={inputClass} {...form.register("email")} {...fieldMetadata("resident-email", false, Boolean(form.formState.errors.email), true)} /></Field>
          <Field id="resident-gang" label="Gang/Blok Rumah" required error={form.formState.errors.gang?.message}><select className={inputClass} {...form.register("gang")} {...fieldMetadata("resident-gang", false, Boolean(form.formState.errors.gang), true)}><option value="">Pilih gang</option><option value="1">Gang 1 (Satu)</option><option value="2">Gang 2 (Dua)</option><option value="3">Gang 3 (Tiga)</option><option value="5">Gang 5 (Lima)</option></select></Field>
          <Field id="resident-house-number" label="Nomor Rumah" required hint="Contoh: 62" error={form.formState.errors.houseNumber?.message}><input className={inputClass} inputMode="numeric" {...form.register("houseNumber")} {...fieldMetadata("resident-house-number", true, Boolean(form.formState.errors.houseNumber), true)} /></Field>
          <Field id="resident-house-status" label="Status Rumah di OPAL" required error={form.formState.errors.houseStatus?.message}><select className={inputClass} {...form.register("houseStatus")} {...fieldMetadata("resident-house-status", false, Boolean(form.formState.errors.houseStatus), true)}><option value="self">Terisi, dihuni sendiri</option><option value="relative">Terisi, dihuni kerabat</option><option value="tenant">Terisi, dihuni penyewa</option><option value="vacant_rent">Kosong, disewakan</option><option value="vacant_sale">Kosong, dijual</option></select></Field>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-[1.4rem] font-bold tracking-[-0.045em] text-ink">Penanggung jawab rumah</legend>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">Penanggung jawab adalah pemilik rumah secara legal, bukan penyewa maupun kerabat pemilik.</p>
        <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field id="resident-responsible-name" label="Nama lengkap penanggung jawab" required error={form.formState.errors.responsibleName?.message}><input autoComplete="name" className={inputClass} {...form.register("responsibleName")} {...fieldMetadata("resident-responsible-name", false, Boolean(form.formState.errors.responsibleName), true)} /></Field>
          <Field id="resident-whatsapp" label="Nomor WhatsApp" required hint="Format: 08112345678" error={form.formState.errors.whatsapp?.message}><input inputMode="tel" autoComplete="tel" className={inputClass} {...form.register("whatsapp")} {...fieldMetadata("resident-whatsapp", true, Boolean(form.formState.errors.whatsapp), true)} /></Field>
          <div className="sm:col-span-2"><Field id="resident-responsible-address" label="Alamat penanggung jawab" required hint="Isi alamat lengkap. Bila domisili tetap berada di OPAL, tulis alamat OPAL Residence." error={form.formState.errors.responsibleAddress?.message}><textarea className={`${inputClass} min-h-32 py-3`} {...form.register("responsibleAddress")} {...fieldMetadata("resident-responsible-address", true, Boolean(form.formState.errors.responsibleAddress), true)} /></Field></div>
          <div className="sm:col-span-2"><FileField id="resident-responsible-ktp" label="KTP Penanggung Jawab" hint="KTP pemilik rumah yang resmi secara legalitas." onFiles={(files) => { setResponsibleKtp(files[0] ?? null); setUploadError(""); }} error={!responsibleKtp && uploadError ? "KTP penanggung jawab belum dipilih." : undefined} />{responsibleKtp ? <UploadSummary>{responsibleKtp.name}</UploadSummary> : null}</div>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-[1.4rem] font-bold tracking-[-0.045em] text-ink">Data umum penghuni rumah</legend>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">Cantumkan seluruh penghuni tetap, termasuk asisten rumah tangga bila ada.</p>
        <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field id="resident-head-of-household-name" label="Nama Kepala Keluarga" required error={form.formState.errors.headOfHouseholdName?.message}><input className={inputClass} {...form.register("headOfHouseholdName")} {...fieldMetadata("resident-head-of-household-name", false, Boolean(form.formState.errors.headOfHouseholdName), true)} /></Field>
          <Field id="resident-head-of-household-occupation" label="Pekerjaan Kepala Keluarga" required error={form.formState.errors.headOfHouseholdOccupation?.message}><select className={inputClass} {...form.register("headOfHouseholdOccupation")} {...fieldMetadata("resident-head-of-household-occupation", false, Boolean(form.formState.errors.headOfHouseholdOccupation), true)}><option value="employee">Pegawai</option><option value="entrepreneur">Wiraswasta</option><option value="student">Pelajar</option></select></Field>
          <Field id="resident-occupants-count" label="Jumlah Penghuni Rumah" required hint="Termasuk asisten rumah tangga bila ada." error={form.formState.errors.occupantsCount?.message}><input type="number" min="1" max="30" className={inputClass} {...form.register("occupantsCount")} {...fieldMetadata("resident-occupants-count", true, Boolean(form.formState.errors.occupantsCount), true)} /></Field>
          <div className="sm:col-span-2"><FileField id="resident-occupant-ktps" label="KTP Seluruh Penghuni" hint="Unggah KTP seluruh penghuni. Unggah ulang KTP penanggung jawab bila ikut menghuni. Maksimal 10 foto." multiple onFiles={(files) => { setOccupantKtps(files.slice(0, 10)); setUploadError(""); }} error={occupantKtps.length === 0 && uploadError ? "Minimal satu KTP penghuni wajib diunggah." : undefined} />{occupantKtps.length ? <UploadSummary>{occupantKtps.length} foto KTP siap diunggah</UploadSummary> : null}</div>
          <div className="sm:col-span-2"><FileField id="resident-family-card" label="Kartu Keluarga (KK)" hint="Unggah dalam bentuk gambar, misalnya PNG atau JPG; bukan PDF atau DOCX." onFiles={(files) => { setFamilyCard(files[0] ?? null); setUploadError(""); }} error={!familyCard && uploadError ? "Kartu Keluarga belum dipilih." : undefined} />{familyCard ? <UploadSummary>{familyCard.name}</UploadSummary> : null}</div>
        </div>
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className="text-[1.4rem] font-bold tracking-[-0.045em] text-ink">Feedback OPAL</legend>
        <p className="mt-2 max-w-2xl text-base leading-7 text-ink-muted">Sampaikan masukan bila ada. Bagian ini tidak wajib diisi.</p>
        <div className="mt-7 grid gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field id="resident-environment-feedback" label="Feedback untuk Lingkungan OPAL" optional><textarea className={`${inputClass} min-h-36 py-3`} {...form.register("environmentFeedback")} {...fieldMetadata("resident-environment-feedback", false, false)} /></Field>
          <Field id="resident-management-feedback" label="Feedback untuk Pengurus" optional><textarea className={`${inputClass} min-h-36 py-3`} {...form.register("managementFeedback")} {...fieldMetadata("resident-management-feedback", false, false)} /></Field>
        </div>
      </fieldset>

      <div className="border-t border-line pt-8">
        <div className="flex max-w-3xl items-start gap-3 border-l-4 border-brand bg-brand-soft/40 px-4 py-4 text-base leading-7 text-ink-muted"><LockKey size={22} className="mt-0.5 shrink-0 text-brand" weight="fill" aria-hidden="true" /><p>Periksa kembali KTP dan KK sebelum mengirim. Berkas disimpan privat untuk pengurus OPAL dan tidak pernah ditampilkan di halaman publik. Bila ada kesalahan unggahan, hubungi pengurus RT untuk penghapusan data.</p></div>
        {uploadError ? <div className="mt-5 flex items-start gap-3 border-l-4 border-danger bg-danger-soft px-4 py-4 text-base font-semibold leading-6 text-danger-deep" role="alert"><WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /><span>{uploadError}</span></div> : null}
        {status !== "idle" ? <div className={`mt-5 flex items-start gap-3 border-l-4 px-4 py-4 text-base font-semibold leading-6 ${status === "success" ? "border-brand bg-brand-soft text-ink" : status === "error" ? "border-danger bg-danger-soft text-danger-deep" : "border-line bg-surface-subtle text-ink-muted"}`} role={status === "error" ? "alert" : "status"} aria-live={status === "error" ? "assertive" : "polite"}>{status === "success" ? <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> : status === "error" ? <WarningCircle size={22} weight="fill" className="mt-0.5 shrink-0" aria-hidden="true" /> : null}<span>{message || "Menyiapkan pengiriman aman. Mohon tunggu."}</span></div> : null}
        <button disabled={status === "submitting"} aria-disabled={status === "submitting"} className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-action px-6 text-base font-bold text-on-action hover:bg-brand hover:text-on-brand disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><PaperPlaneTilt size={20} weight="fill" aria-hidden="true" />{status === "submitting" ? "Mengirim dengan aman..." : "Kirim data warga"}</button>
      </div>
    </form>
  );
}
