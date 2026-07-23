import { CheckCircle, FileLock, GearSix, HouseLine, Receipt, SignOut, Stamp, UsersThree, Wrench } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { issueServiceRequest, revokePropertyLink, reviewResidentSubmission, reviewServiceRequest, rotatePropertyLink, saveAnnouncement, saveCashTransaction, saveDocumentSettings, saveFeeSchedule, saveFloorPlanAsset, saveGuideSection, saveHomeSpec, saveResource, saveStaffProfile, signOut } from "@/app/admin/actions";
import { MarkdownEditor } from "@/components/markdown-editor";
import { WhatsAppActions } from "@/components/whatsapp-actions";
import { getAdminContext } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin RT" };

type FeeRow = { id: string; label: string; amount_rupiah: number; payment_method: string; destination: string; description: string; effective_from: string; is_active: boolean };
type AnnouncementRow = { id: string; title: string; body: string; published_at: string; pinned: boolean; published: boolean };
type ResourceRow = { id: string; title: string; description: string; href: string; category: string; requires_google_login: boolean; published: boolean; sort_order: number };
type GuideRow = { id: string; title: string; summary: string; body_markdown: string; sort_order: number; published: boolean };
type DocumentSettingsRow = { signer_name: string; signer_title: string; rt_number: string; rw_number: string; kelurahan: string; kecamatan: string; kabupaten: string; provinsi: string; city: string; number_format: string; enabled: boolean };
type EvidenceRow = { id: string; evidence_kind: string; original_name: string };
type ResidentSubmissionRow = { id: string; status: string; contact_email: string; payload: Record<string, unknown>; created_at: string; admin_note: string | null; properties: { unit_code: string } | { unit_code: string }[] | null; resident_evidence: EvidenceRow[] };
type ServiceRequestRow = { id: string; request_type: "move" | "domicile" | "single"; status: string; contact_name: string; contact_email: string; contact_whatsapp: string; payload: Record<string, unknown>; created_at: string; admin_note: string | null; properties: { unit_code: string } | { unit_code: string }[] | null };
type PropertyRow = { id: string; unit_code: string; access_token_created_at: string | null; access_token_revoked_at: string | null };
type StaffRow = { id: string; name: string; role: string; whatsapp: string | null; published: boolean; sort_order: number };
type SpecRow = { id: string; category: "Keramik" | "Cat" | "Kontak"; label: string; value: string; published: boolean; sort_order: number };
type PlanRow = { id: string; title: string; alt_text: string; storage_path: string; published: boolean; sort_order: number };

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15";
const textareaClass = "mt-2 min-h-24 w-full resize-y rounded-xl border border-line bg-surface p-3.5 text-sm leading-6 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-extrabold text-ink">{label}{children}</label>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-ink-muted"><input name={name} type="checkbox" defaultChecked={checked} className="size-4 accent-brand" /> {label}</label>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getAdminContext();
  if (context.kind === "signed-out") redirect("/admin/login");
  if (context.kind === "forbidden") redirect("/admin/login?reason=forbidden");
  if (context.kind === "setup") return <SetupState />;

  const supabase = await createSupabaseServerClient();
  const [feesResult, announcementsResult, resourcesResult, sectionsResult, settingsResult, submissionsResult, requestsResult, propertiesResult, staffResult, specsResult, plansResult] = await Promise.all([
    supabase.from("fee_schedules").select("*").order("label").order("effective_from", { ascending: false }),
    supabase.from("announcements").select("*").order("published_at", { ascending: false }),
    supabase.from("resources").select("*").order("sort_order"),
    supabase.from("guide_sections").select("*").order("sort_order"),
    supabase.from("document_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("resident_submissions").select("id,status,contact_email,payload,created_at,admin_note,properties(unit_code),resident_evidence(id,evidence_kind,original_name)").order("created_at", { ascending: false }).limit(30),
    supabase.from("service_requests").select("id,request_type,status,contact_name,contact_email,contact_whatsapp,payload,created_at,admin_note,properties(unit_code)").order("created_at", { ascending: false }).limit(30),
    supabase.from("properties").select("id,unit_code,access_token_created_at,access_token_revoked_at").order("unit_code").limit(300),
    supabase.from("staff_profiles").select("id,name,role,whatsapp,published,sort_order").order("sort_order"),
    supabase.from("home_specs").select("id,category,label,value,published,sort_order").order("sort_order"),
    supabase.from("floor_plan_assets").select("id,title,alt_text,storage_path,published,sort_order").order("sort_order"),
  ]);
  const fees = (feesResult.data ?? []) as FeeRow[];
  const announcements = (announcementsResult.data ?? []) as AnnouncementRow[];
  const resources = (resourcesResult.data ?? []) as ResourceRow[];
  const sections = (sectionsResult.data ?? []) as GuideRow[];
  const settings = settingsResult.data as DocumentSettingsRow | null;
  const submissions = (submissionsResult.data ?? []) as ResidentSubmissionRow[];
  const requests = (requestsResult.data ?? []) as ServiceRequestRow[];
  const properties = (propertiesResult.data ?? []) as PropertyRow[];
  const staff = (staffResult.data ?? []) as StaffRow[];
  const specs = (specsResult.data ?? []) as SpecRow[];
  const plans = (plansResult.data ?? []) as PlanRow[];
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const homeLink = typeof params.homeLink === "string" && /^https?:\/\//.test(params.homeLink) ? params.homeLink : "";

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-6 border-b border-line pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="border-l-2 border-brand pl-5"><p className="text-sm font-semibold text-brand">Admin RT</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">Kelola informasi portal</h1><p className="mt-3 text-sm leading-6 text-ink-muted">Masuk sebagai {context.email}. Perubahan yang dipublikasikan langsung tampil untuk warga.</p></div>
        <form action={signOut}><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"><SignOut size={17} weight="bold" aria-hidden="true" /> Keluar</button></form>
      </div>
      {message ? <p className="mt-6 flex items-center gap-2 border-l-2 border-brand bg-brand-soft px-4 py-4 text-sm font-bold text-ink" role="status"><CheckCircle size={20} weight="fill" className="text-brand" aria-hidden="true" />{message}</p> : null}
      {homeLink ? <p className="mt-4 break-all border-l-2 border-brand bg-surface-subtle px-4 py-4 text-sm leading-6 text-ink"><strong className="text-ink">Tautan privat baru:</strong> <a className="font-bold text-brand-deep hover:text-brand" href={homeLink}>{homeLink}</a></p> : null}
      {!fees.length || !resources.length || !sections.length ? <p className="mt-6 border-l-2 border-warm bg-warm px-4 py-4 text-sm leading-6 text-ink-muted">Konten awal belum ada di database. Jalankan <code className="rounded bg-surface px-1.5 py-0.5 text-ink">supabase/schema.sql</code> lalu <code className="rounded bg-surface px-1.5 py-0.5 text-ink">supabase/seed.sql</code> agar editor ini terisi.</p> : null}

      <div className="mt-9 grid gap-10">
        <section id="surat" className="scroll-mt-28"><SectionHeading icon="stamp" title="Penerbitan surat" description="Surat tetap terkunci sampai identitas RT dan format nomor resmi diisi. Identitas dari template lama tidak digunakan." /><div className="mt-5"><DocumentSettingsForm settings={settings} /></div></section>
        <section id="antrean" className="scroll-mt-28"><SectionHeading icon="users" title="Antrean operasional" description="Tinjau pendataan dan surat sebelum data rumah disahkan atau PDF resmi diterbitkan." /><div className="mt-5 grid gap-5 xl:grid-cols-2"><div><h3 className="mb-3 text-sm font-extrabold text-ink">Pendataan warga ({submissions.length})</h3><div className="grid gap-4">{submissions.map((submission) => <ResidentReviewForm key={submission.id} submission={submission} />)}{!submissions.length ? <EmptyQueue label="Belum ada pendataan yang masuk." /> : null}</div></div><div><h3 className="mb-3 text-sm font-extrabold text-ink">Permohonan surat ({requests.length})</h3><div className="grid gap-4">{requests.map((request) => <ServiceRequestReviewForm key={request.id} request={request} />)}{!requests.length ? <EmptyQueue label="Belum ada permohonan surat." /> : null}</div></div></div></section>
        <section id="rumah" className="scroll-mt-28"><SectionHeading icon="house" title="Tautan privat rumah" description="Buat, putar, atau cabut tautan yang menampilkan status iuran dan riwayat surat satu rumah—tanpa KTP maupun KK." /><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <PropertyLinkForm key={property.id} property={property} />)}{!properties.length ? <EmptyQueue label="Data rumah akan muncul setelah migrasi atau pendataan pertama." /> : null}</div></section>
        <section id="kas" className="scroll-mt-28"><SectionHeading icon="cash" title="Kas OPAL" description="Simpan pemasukan atau pengeluaran sebagai transaksi terstruktur; pilih apakah baris tersebut tampil dalam ringkasan publik." /><div className="mt-5 max-w-2xl"><CashTransactionForm /></div></section>
        <section id="iuran" className="scroll-mt-28"><SectionHeading icon="gear" title="Iuran aktif" description="Menyimpan iuran akan membuat jadwal baru dan mempertahankan riwayat nominal sebelumnya." />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{fees.filter((fee) => fee.is_active).map((fee) => <FeeForm key={fee.id} fee={fee} />)}</div>
        </section>
        <section id="pengumuman" className="scroll-mt-28"><SectionHeading icon="gear" title="Pengumuman" description="Gunakan satu pengumuman yang dipin untuk informasi paling penting di beranda." />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{announcements.map((announcement) => <AnnouncementForm key={announcement.id} announcement={announcement} />)}<AnnouncementForm /></div>
        </section>
        <section id="layanan" className="scroll-mt-28"><SectionHeading icon="gear" title="Tautan layanan" description="Tautan tetap menuju sumber aslinya. Tandai jika warga perlu login Google." />
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{resources.map((resource) => <ResourceForm key={resource.id} resource={resource} />)}<ResourceForm /></div>
        </section>
        <section id="panduan" className="scroll-mt-28"><SectionHeading icon="wrench" title="Panduan harmonis" description="Gunakan Markdown sederhana. HTML mentah tidak akan dirender pada halaman warga." />
          <div className="mt-5 grid gap-5">{sections.map((section) => <GuideForm key={section.id} section={section} />)}</div>
        </section>
        <section id="fasilitas" className="scroll-mt-28"><SectionHeading icon="wrench" title="Petugas, spesifikasi, dan denah" description="Kelola informasi operasional yang diterbitkan untuk warga. Foto denah disimpan pada bucket aset, terpisah dari berkas identitas." />
          <div className="mt-5 grid gap-8"><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Petugas</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{staff.map((item) => <StaffForm key={item.id} staff={item} />)}<StaffForm /></div></div><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Spesifikasi rumah</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{specs.map((item) => <SpecForm key={item.id} spec={item} />)}<SpecForm /></div></div><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Denah</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{plans.map((item) => <PlanForm key={item.id} plan={item} />)}<PlanForm /></div></div></div>
        </section>
      </div>
    </div>
  );
}

function SetupState() {
  return <div className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-14 sm:px-8 lg:px-10"><div className="max-w-2xl border-l-2 border-brand bg-surface-subtle px-7 py-8 sm:px-9 sm:py-10"><GearSix size={35} weight="fill" className="text-brand" aria-hidden="true" /><p className="mt-7 text-sm font-semibold text-brand">Pengaturan diperlukan</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-ink">Admin siap setelah Supabase dihubungkan.</h1><p className="mt-4 leading-7 text-ink-muted">Tambahkan variabel lingkungan Supabase dan daftar email admin, lalu terapkan skema dan data awal yang tersedia di repository ini. Konten publik tetap menampilkan versi bawaan sampai database terhubung.</p></div></div>;
}

function SectionHeading({ icon, title, description }: { icon: "gear" | "wrench" | "stamp" | "users" | "house" | "cash"; title: string; description: string }) {
  const Icon = icon === "gear" ? GearSix : icon === "stamp" ? Stamp : icon === "users" ? UsersThree : icon === "house" ? HouseLine : icon === "cash" ? Receipt : Wrench;
  return <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-soft text-brand-deep"><Icon size={23} weight="fill" aria-hidden="true" /></span><div><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">{title}</h2><p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p></div></div>;
}

function FeeForm({ fee }: { fee: FeeRow }) {
  return <form action={saveFeeSchedule} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><h3 className="text-lg font-extrabold tracking-[-0.03em] text-ink">{fee.label}</h3><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nama iuran"><input name="label" defaultValue={fee.label} required className={inputClass} /></Field><Field label="Nominal (Rp)"><input name="amountRupiah" type="number" min="1" step="1" defaultValue={fee.amount_rupiah} required className={inputClass} /></Field><Field label="Berlaku mulai"><input name="effectiveFrom" type="date" defaultValue={fee.effective_from} required className={inputClass} /></Field><Field label="Metode pembayaran"><input name="paymentMethod" defaultValue={fee.payment_method} required className={inputClass} /></Field></div><Field label="Tujuan pembayaran"><input name="destination" defaultValue={fee.destination} className={inputClass} /></Field><Field label="Keterangan"><textarea name="description" defaultValue={fee.description} className={textareaClass} /></Field><button className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand">Simpan jadwal baru</button></form>;
}

function AnnouncementForm({ announcement }: { announcement?: AnnouncementRow }) {
  return <form action={saveAnnouncement} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><input type="hidden" name="id" value={announcement?.id ?? ""} /><h3 className="text-lg font-extrabold tracking-[-0.03em] text-ink">{announcement ? "Ubah pengumuman" : "Buat pengumuman"}</h3><div className="mt-5 grid gap-4"><Field label="Judul"><input name="title" defaultValue={announcement?.title} required className={inputClass} /></Field><Field label="Isi"><textarea name="body" defaultValue={announcement?.body} required className={textareaClass} /></Field><Field label="Tanggal publikasi"><input name="publishedAt" type="date" defaultValue={announcement?.published_at ?? new Date().toISOString().slice(0, 10)} required className={inputClass} /></Field><div className="flex flex-wrap gap-x-5 gap-y-2"><Toggle name="pinned" label="Sematkan di beranda" checked={announcement?.pinned ?? false} /><Toggle name="published" label="Tampilkan ke warga" checked={announcement?.published ?? true} /></div></div><button className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand">Simpan pengumuman</button></form>;
}

function ResourceForm({ resource }: { resource?: ResourceRow }) {
  return <form action={saveResource} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><input type="hidden" name="id" value={resource?.id ?? ""} /><h3 className="text-lg font-extrabold tracking-[-0.03em] text-ink">{resource ? resource.title : "Tambah layanan"}</h3><div className="mt-5 grid gap-4"><Field label="Judul"><input name="title" defaultValue={resource?.title} required className={inputClass} /></Field><Field label="Deskripsi"><textarea name="description" defaultValue={resource?.description} required className={textareaClass} /></Field><Field label="Tautan sumber"><input name="href" type="url" defaultValue={resource?.href} required className={inputClass} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Kategori"><select name="category" defaultValue={resource?.category ?? "Surat"} className={inputClass}><option>Keuangan</option><option>Surat</option><option>Data warga</option><option>Fasilitas</option><option>Rumah</option></select></Field><Field label="Urutan"><input name="sortOrder" type="number" min="1" step="1" defaultValue={resource?.sort_order ?? 99} required className={inputClass} /></Field></div><div className="flex flex-wrap gap-x-5 gap-y-2"><Toggle name="requiresGoogleLogin" label="Perlu login Google" checked={resource?.requires_google_login ?? false} /><Toggle name="published" label="Tampilkan ke warga" checked={resource?.published ?? true} /></div></div><button className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand">Simpan layanan</button></form>;
}

function GuideForm({ section }: { section: GuideRow }) {
  return <form action={saveGuideSection} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><input type="hidden" name="id" value={section.id} /><div className="grid gap-4 md:grid-cols-[1fr_8rem]"><Field label="Judul"><input name="title" defaultValue={section.title} required className={inputClass} /></Field><Field label="Urutan"><input name="sortOrder" type="number" min="1" step="1" defaultValue={section.sort_order} required className={inputClass} /></Field></div><Field label="Ringkasan"><textarea name="summary" defaultValue={section.summary} required className={textareaClass} /></Field><div className="mt-4"><MarkdownEditor name="bodyMarkdown" label="Isi panduan (Markdown)" defaultValue={section.body_markdown} /></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><Toggle name="published" label="Tampilkan ke warga" checked={section.published} /><button className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand">Simpan panduan</button></div></form>;
}

function unitFrom(value: ResidentSubmissionRow["properties"] | ServiceRequestRow["properties"]) {
  const property = Array.isArray(value) ? value[0] : value;
  return property?.unit_code ?? "Rumah belum cocok";
}

function EmptyQueue({ label }: { label: string }) {
  return <p className="border border-dashed border-line px-4 py-5 text-sm leading-6 text-ink-muted">{label}</p>;
}

function DocumentSettingsForm({ settings }: { settings: DocumentSettingsRow | null }) {
  return <form action={saveDocumentSettings} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><p className="max-w-2xl text-sm leading-6 text-ink-muted">Gunakan format nomor seperti <code className="rounded bg-surface px-1.5 py-0.5 text-ink">&#123;number&#125;/&#123;code&#125;/RT-&#123;year&#125;</code>. Sistem hanya mengganti placeholder <code className="rounded bg-surface px-1.5 py-0.5 text-ink">&#123;number&#125;</code>, <code className="rounded bg-surface px-1.5 py-0.5 text-ink">&#123;code&#125;</code>, dan <code className="rounded bg-surface px-1.5 py-0.5 text-ink">&#123;year&#125;</code>.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nama penandatangan"><input name="signerName" defaultValue={settings?.signer_name} className={inputClass} /></Field><Field label="Jabatan penandatangan"><input name="signerTitle" defaultValue={settings?.signer_title ?? "Ketua RT"} className={inputClass} /></Field><Field label="Nomor RT"><input name="rtNumber" defaultValue={settings?.rt_number} className={inputClass} /></Field><Field label="Nomor RW"><input name="rwNumber" defaultValue={settings?.rw_number} className={inputClass} /></Field><Field label="Kelurahan"><input name="kelurahan" defaultValue={settings?.kelurahan ?? "Tambakrejo"} className={inputClass} /></Field><Field label="Kecamatan"><input name="kecamatan" defaultValue={settings?.kecamatan ?? "Waru"} className={inputClass} /></Field><Field label="Kabupaten/Kota"><input name="kabupaten" defaultValue={settings?.kabupaten ?? "Sidoarjo"} className={inputClass} /></Field><Field label="Provinsi"><input name="provinsi" defaultValue={settings?.provinsi ?? "Jawa Timur"} className={inputClass} /></Field><Field label="Kota pada tanggal surat"><input name="city" defaultValue={settings?.city ?? "Sidoarjo"} className={inputClass} /></Field><Field label="Format nomor surat"><input name="numberFormat" defaultValue={settings?.number_format ?? "{number}/{code}/RT-{year}"} className={inputClass} /></Field></div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><Toggle name="enabled" label="Buka penerbitan surat setelah konfigurasi lengkap" checked={settings?.enabled ?? false} /><button className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse hover:-translate-y-0.5 hover:bg-brand">Simpan pengaturan surat</button></div></form>;
}

function ResidentReviewForm({ submission }: { submission: ResidentSubmissionRow }) {
  const payload = submission.payload;
  const whatsapp = typeof payload.whatsapp === "string" ? payload.whatsapp : "";
  return <article className="rounded-[18px] border border-line bg-surface-raised p-5"><div className="flex gap-3"><FileLock size={21} weight="fill" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /><div className="min-w-0"><p className="font-extrabold text-ink">{unitFrom(submission.properties)}</p><p className="mt-1 text-sm text-ink-muted">Masuk {submission.created_at.slice(0, 10)} · {submission.status}</p></div></div><dl className="mt-4 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2"><div><dt className="text-ink-faint">Penanggung jawab</dt><dd className="font-bold text-ink">{String(payload.responsibleName ?? "-")}</dd></div><div><dt className="text-ink-faint">Jumlah penghuni</dt><dd className="font-bold text-ink">{String(payload.occupantsCount ?? "-")}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2">{submission.resident_evidence.map((evidence) => <a key={evidence.id} href={`/api/admin/evidence/${evidence.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-brand-deep hover:border-brand hover:text-brand">{evidence.evidence_kind === "family_card" ? "Buka KK" : "Buka KTP"}</a>)}</div>{whatsapp ? <div className="mt-4"><WhatsAppActions phone={whatsapp} message={`Halo, kami dari pengurus RT OPAL terkait pendataan rumah ${unitFrom(submission.properties)}.`} /></div> : null}<form action={reviewResidentSubmission} className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={submission.id} /><div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><Field label="Status"><select name="status" defaultValue={submission.status === "submitted" ? "in_review" : submission.status} className={inputClass}><option value="in_review">Sedang diperiksa</option><option value="needs_revision">Perlu revisi</option><option value="approved">Setujui dan sahkan data rumah</option><option value="rejected">Tolak</option></select></Field><Field label="Catatan RT"><input name="adminNote" defaultValue={submission.admin_note ?? ""} className={inputClass} /></Field></div><button className="mt-4 inline-flex min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan review</button></form></article>;
}

function ServiceRequestReviewForm({ request }: { request: ServiceRequestRow }) {
  const title = request.request_type === "move" ? "Pindah rumah" : request.request_type === "domicile" ? "Domisili" : "Belum menikah";
  return <article className="rounded-[18px] border border-line bg-surface-raised p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold text-ink">{title} · {unitFrom(request.properties)}</p><p className="mt-1 text-sm text-ink-muted">{request.contact_name} · {request.created_at.slice(0, 10)} · {request.status}</p></div></div><details className="mt-4 border-y border-line py-3"><summary className="cursor-pointer text-sm font-bold text-brand-deep">Lihat data pengajuan</summary><dl className="mt-3 grid gap-2 text-sm">{Object.entries(request.payload).filter(([key]) => !["website", "contactEmail", "contactWhatsapp"].includes(key)).map(([key, value]) => <div key={key} className="grid gap-1 sm:grid-cols-[0.42fr_1fr]"><dt className="text-ink-faint">{key}</dt><dd className="break-words text-ink">{String(value)}</dd></div>)}</dl></details><div className="mt-4"><WhatsAppActions phone={request.contact_whatsapp} message={`Halo ${request.contact_name}, kami dari pengurus RT OPAL terkait permohonan surat ${title.toLowerCase()} Anda.`} /></div><form action={reviewServiceRequest} className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={request.id} /><div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><Field label="Status"><select name="status" defaultValue={request.status === "submitted" ? "in_review" : request.status} className={inputClass}><option value="in_review">Sedang diperiksa</option><option value="needs_revision">Perlu revisi</option><option value="approved">Setujui untuk diterbitkan</option><option value="rejected">Tolak</option></select></Field><Field label="Catatan RT"><input name="adminNote" defaultValue={request.admin_note ?? ""} className={inputClass} /></Field></div><button className="mt-4 inline-flex min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan review</button></form>{request.status === "approved" ? <form action={issueServiceRequest} className="mt-3"><input type="hidden" name="id" value={request.id} /><button className="inline-flex min-h-10 rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-deep">Terbitkan PDF bernomor</button></form> : null}</article>;
}

function PropertyLinkForm({ property }: { property: PropertyRow }) {
  const current = Boolean(property.access_token_created_at && !property.access_token_revoked_at);
  return <article className="border border-line bg-surface-raised p-5"><p className="font-extrabold text-ink">{property.unit_code}</p><p className="mt-1 text-sm text-ink-muted">{current ? "Tautan aktif" : property.access_token_created_at ? "Tautan dicabut" : "Belum ada tautan"}</p><div className="mt-4 flex flex-wrap gap-2"><form action={rotatePropertyLink}><input type="hidden" name="id" value={property.id} /><button className="min-h-10 rounded-full bg-ink px-3.5 text-xs font-bold text-ink-inverse hover:bg-brand">{current ? "Putar tautan" : "Buat tautan"}</button></form>{current ? <form action={revokePropertyLink}><input type="hidden" name="id" value={property.id} /><button className="min-h-10 rounded-full border border-line px-3.5 text-xs font-bold text-ink hover:border-[#a53928] hover:text-[#a53928]">Cabut</button></form> : null}</div></article>;
}

function CashTransactionForm() {
  return <form action={saveCashTransaction} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Tanggal transaksi"><input name="transactionDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className={inputClass} /></Field><Field label="Arah"><select name="direction" defaultValue="income" className={inputClass}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></Field><Field label="Kategori"><input name="category" placeholder="Contoh: Iuran warga" required className={inputClass} /></Field><Field label="Nominal (Rp)"><input name="amountRupiah" type="number" min="1" step="1" required className={inputClass} /></Field></div><Field label="Keterangan"><textarea name="description" className={textareaClass} /></Field><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><Toggle name="isPublic" label="Tampilkan pada ringkasan Kas publik" checked /><button className="inline-flex min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan transaksi</button></div></form>;
}

function StaffForm({ staff }: { staff?: StaffRow }) {
  return <form action={saveStaffProfile} className="rounded-[18px] border border-line bg-surface-raised p-5"><input type="hidden" name="id" value={staff?.id ?? ""} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Nama"><input name="name" defaultValue={staff?.name} required className={inputClass} /></Field><Field label="Peran"><input name="role" defaultValue={staff?.role ?? "Petugas Pos & Taman"} required className={inputClass} /></Field><Field label="WhatsApp"><input name="whatsapp" defaultValue={staff?.whatsapp ?? ""} className={inputClass} /></Field><Field label="Urutan"><input name="sortOrder" type="number" min="1" defaultValue={staff?.sort_order ?? 99} required className={inputClass} /></Field></div><div className="mt-4 flex items-center justify-between gap-4"><Toggle name="published" label="Tampilkan" checked={staff?.published ?? true} /><button className="min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan</button></div></form>;
}

function SpecForm({ spec }: { spec?: SpecRow }) {
  return <form action={saveHomeSpec} className="rounded-[18px] border border-line bg-surface-raised p-5"><input type="hidden" name="id" value={spec?.id ?? ""} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Kategori"><select name="category" defaultValue={spec?.category ?? "Keramik"} className={inputClass}><option>Keramik</option><option>Cat</option><option>Kontak</option></select></Field><Field label="Urutan"><input name="sortOrder" type="number" min="1" defaultValue={spec?.sort_order ?? 99} required className={inputClass} /></Field></div><Field label="Label"><input name="label" defaultValue={spec?.label} required className={inputClass} /></Field><Field label="Nilai / spesifikasi"><textarea name="value" defaultValue={spec?.value} required className={textareaClass} /></Field><div className="mt-4 flex items-center justify-between gap-4"><Toggle name="published" label="Tampilkan" checked={spec?.published ?? true} /><button className="min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan</button></div></form>;
}

function PlanForm({ plan }: { plan?: PlanRow }) {
  return <form action={saveFloorPlanAsset} className="rounded-[18px] border border-line bg-surface-raised p-5"><input type="hidden" name="id" value={plan?.id ?? ""} /><input type="hidden" name="storagePath" value={plan?.storage_path ?? ""} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Judul"><input name="title" defaultValue={plan?.title} required className={inputClass} /></Field><Field label="Urutan"><input name="sortOrder" type="number" min="1" defaultValue={plan?.sort_order ?? 99} required className={inputClass} /></Field></div><Field label="Teks alternatif"><input name="altText" defaultValue={plan?.alt_text} required className={inputClass} /></Field><Field label={plan ? "Ganti berkas denah (opsional)" : "Berkas denah"}><input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-ink-muted" /></Field><div className="mt-4 flex items-center justify-between gap-4"><Toggle name="published" label="Tampilkan" checked={plan?.published ?? true} /><button className="min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan</button></div></form>;
}
