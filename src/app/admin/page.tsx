import { CaretDown, CheckCircle, FileLock, GearSix, HouseLine, Receipt, SignOut, Stamp, UsersThree, Wrench } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addAdminUser, issueServiceRequest, prepareMonthlyContributions, removeAdminUser, reviewResidentSubmission, reviewServiceRequest, saveAnnouncement, saveCashTransaction, saveDocumentSettings, saveFeeSchedule, saveFloorPlanAsset, saveGuideSection, saveHomeSpec, savePropertyContribution, saveResource, saveStaffProfile, signOut } from "@/app/admin/actions";
import { MarkdownEditor } from "@/components/markdown-editor";
import { AdminPropertyDirectory } from "@/components/admin-property-directory";
import { WhatsAppActions } from "@/components/whatsapp-actions";
import { getAdminContext } from "@/lib/admin";
import { formatRupiah } from "@/lib/format";
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
type PropertyRow = { id: string; unit_code: string; occupancy_status: string | null; access_token_created_at: string | null; access_token_revoked_at: string | null; resident_profiles: { responsible_name: string; updated_at: string } | { responsible_name: string; updated_at: string }[] | null; resident_submissions: Array<{ status: string; created_at: string }>; property_contributions: Array<{ status: "paid" | "pending" | "waived"; period: string | null }> };
type StaffRow = { id: string; name: string; role: string; whatsapp: string | null; published: boolean; sort_order: number };
type SpecRow = { id: string; category: "Keramik" | "Cat" | "Kontak"; label: string; value: string; published: boolean; sort_order: number };
type PlanRow = { id: string; title: string; alt_text: string; storage_path: string; published: boolean; sort_order: number };
type CashTransactionRow = { id: string; transaction_date: string; category: string; description: string; direction: "income" | "expense"; amount_rupiah: number; is_public: boolean };
type AdminActivityRow = { id: string; actor_email: string; action: string; entity_type: string; created_at: string };
type ContributionRow = { id: string; category: string; period: string | null; amount_rupiah: number; paid_at: string | null; status: "paid" | "pending" | "waived"; properties: { unit_code: string } | { unit_code: string }[] | null };
type ContributionPeriodRow = { status: "paid" | "pending" | "waived"; amount_rupiah: number };
type AdminUserRow = { email: string; created_at: string };
type IssuedDocumentRow = { id: string; document_number: string; issued_at: string; service_requests: { request_type: "move" | "domicile" | "single"; contact_name: string; properties: { unit_code: string } | { unit_code: string }[] | null } | { request_type: "move" | "domicile" | "single"; contact_name: string; properties: { unit_code: string } | { unit_code: string }[] | null }[] | null };
type AdminSectionIcon = "gear" | "wrench" | "stamp" | "users" | "house" | "cash";

const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15";
const textareaClass = "mt-2 min-h-24 w-full resize-y rounded-xl border border-line bg-surface p-3.5 text-sm leading-6 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15";
const documentSettingKeys: Array<keyof Omit<DocumentSettingsRow, "enabled">> = ["signer_name", "signer_title", "rt_number", "rw_number", "kelurahan", "kecamatan", "kabupaten", "provinsi", "city", "number_format"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-extrabold text-ink">{label}{children}</label>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-ink-muted"><input name={name} type="checkbox" defaultChecked={checked} className="size-4 accent-brand" /> {label}</label>;
}

function isPending(status: string) {
  return status === "submitted" || status === "in_review" || status === "needs_revision";
}

function reviewPriority(status: string) {
  if (status === "approved") return 0;
  if (isPending(status)) return 1;
  return 2;
}

function isDocumentReady(settings: DocumentSettingsRow | null) {
  return Boolean(settings?.enabled && documentSettingKeys.every((key) => settings[key]));
}

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function formatAdminDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function currentJakartaPeriod() {
  const values = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", timeZone: "Asia/Jakarta" }).formatToParts(new Date());
  const year = values.find((value) => value.type === "year")?.value;
  const month = values.find((value) => value.type === "month")?.value;
  return `${year}-${month}-01`;
}

function formatAdminMonth(value: string) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function statusMeta(status: string) {
  if (status === "paid") return { label: "Sudah dibayar", className: "bg-brand-soft text-brand-deep" };
  if (status === "pending") return { label: "Belum dibayar", className: "bg-warm text-ink" };
  if (status === "waived") return { label: "Dibebaskan", className: "bg-surface-subtle text-ink-muted" };
  if (status === "approved") return { label: "Disetujui", className: "bg-brand-soft text-brand-deep" };
  if (status === "issued") return { label: "Diterbitkan", className: "bg-brand-soft text-brand-deep" };
  if (status === "needs_revision") return { label: "Perlu revisi", className: "bg-warm text-ink" };
  if (status === "rejected") return { label: "Ditolak", className: "bg-danger-soft text-danger-deep" };
  if (status === "in_review") return { label: "Sedang diperiksa", className: "bg-surface-subtle text-ink-muted" };
  return { label: "Baru masuk", className: "bg-surface-subtle text-ink-muted" };
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-extrabold ${meta.className}`}>{meta.label}</span>;
}

function reviewMessage({ name, unit, status, note, subject }: { name: string; unit: string; status: string; note: string | null; subject: string }) {
  const greeting = `Halo ${name}, kami dari pengurus RT OPAL terkait ${subject} untuk ${unit}.`;
  const noteLine = note ? `\n\nCatatan RT: ${note}` : "";
  if (status === "approved") return `${greeting}\n\nData telah disetujui. Kami akan melanjutkan proses berikutnya.${noteLine}`;
  if (status === "issued") return `${greeting}\n\nSurat telah diterbitkan dan dapat diambil atau ditindaklanjuti sesuai arahan pengurus.${noteLine}`;
  if (status === "needs_revision") return `${greeting}\n\nMohon melakukan revisi atau melengkapi data yang diperlukan.${noteLine || "\n\nSilakan hubungi pengurus bila memerlukan bantuan."}`;
  if (status === "rejected") return `${greeting}\n\nPengajuan belum dapat diproses.${noteLine || "\n\nSilakan hubungi pengurus untuk penjelasan lebih lanjut."}`;
  if (status === "in_review") return `${greeting}\n\nData sedang diperiksa oleh pengurus. Kami akan memberi kabar setelah proses selesai.${noteLine}`;
  return `${greeting}\n\nData sudah kami terima dan akan diperiksa oleh pengurus.`;
}

const residentStatusLabels: Record<string, string> = { self: "Dihuni sendiri", relative: "Dihuni kerabat", tenant: "Dihuni penyewa", vacant_rent: "Kosong, disewakan", vacant_sale: "Kosong, dijual" };
const occupationLabels: Record<string, string> = { employee: "Pegawai", entrepreneur: "Wiraswasta", student: "Pelajar" };
const requestFieldLabels: Record<string, string> = {
  contactName: "Nama pemohon", contactEmail: "Email", contactWhatsapp: "WhatsApp", fullName: "Nama lengkap", nik: "NIK", kk: "Nomor KK", gender: "Jenis kelamin", birthPlaceDate: "Tempat, tanggal lahir", religion: "Agama", citizenship: "Kewarganegaraan", occupation: "Pekerjaan", maritalStatus: "Status perkawinan", address: "Alamat", oldAddress: "Alamat lama", oldVillage: "Kelurahan lama", oldDistrict: "Kecamatan lama", oldRegency: "Kabupaten/kota lama", oldProvince: "Provinsi lama", newAddress: "Alamat baru", newVillage: "Kelurahan baru", newDistrict: "Kecamatan baru", newRegency: "Kabupaten/kota baru", newProvince: "Provinsi baru", reason: "Alasan pindah", followersCount: "Jumlah pengikut", gang: "Gang", houseNumber: "Nomor rumah",
};

function requestFieldLabel(key: string) {
  return requestFieldLabels[key] ?? key;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getAdminContext();
  if (context.kind === "signed-out") redirect("/admin/login");
  if (context.kind === "forbidden") redirect("/admin/login?reason=forbidden");
  if (context.kind === "setup") return <SetupState />;

  const supabase = await createSupabaseServerClient();
  const currentPeriod = currentJakartaPeriod();
  const [feesResult, announcementsResult, resourcesResult, sectionsResult, settingsResult, submissionsResult, requestsResult, propertiesResult, cashResult, contributionsResult, currentPeriodContributionsResult, activitiesResult, issuedDocumentsResult, adminUsersResult, pendingSubmissionsCountResult, pendingRequestsCountResult, issuableRequestsCountResult, activePropertyLinksCountResult, pendingContributionsCountResult, staffResult, specsResult, plansResult] = await Promise.all([
    supabase.from("fee_schedules").select("*").order("label").order("effective_from", { ascending: false }),
    supabase.from("announcements").select("*").order("published_at", { ascending: false }),
    supabase.from("resources").select("*").order("sort_order"),
    supabase.from("guide_sections").select("*").order("sort_order"),
    supabase.from("document_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("resident_submissions").select("id,status,contact_email,payload,created_at,admin_note,properties(unit_code),resident_evidence(id,evidence_kind,original_name)").in("status", ["submitted", "in_review", "needs_revision"]).order("created_at", { ascending: false }),
    supabase.from("service_requests").select("id,request_type,status,contact_name,contact_email,contact_whatsapp,payload,created_at,admin_note,properties(unit_code)").in("status", ["submitted", "in_review", "needs_revision", "approved"]).order("created_at", { ascending: false }),
    supabase.from("properties").select("id,unit_code,occupancy_status,access_token_created_at,access_token_revoked_at,resident_profiles(responsible_name,updated_at),resident_submissions(status,created_at),property_contributions(status,period)").order("unit_code"),
    supabase.from("cash_transactions").select("id,transaction_date,category,description,direction,amount_rupiah,is_public").order("transaction_date", { ascending: false }),
    supabase.from("property_contributions").select("id,category,period,amount_rupiah,paid_at,status,properties(unit_code)").order("period", { ascending: false }).limit(20),
    supabase.from("property_contributions").select("status,amount_rupiah").eq("period", currentPeriod),
    supabase.from("admin_activity").select("id,actor_email,action,entity_type,created_at").order("created_at", { ascending: false }).limit(16),
    supabase.from("document_issuances").select("id,document_number,issued_at,service_requests(request_type,contact_name,properties(unit_code))").order("issued_at", { ascending: false }),
    supabase.from("admin_users").select("email,created_at").order("email"),
    supabase.from("resident_submissions").select("id", { count: "exact", head: true }).in("status", ["submitted", "in_review", "needs_revision"]),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "in_review", "needs_revision"]),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("properties").select("id", { count: "exact", head: true }).not("access_token_created_at", "is", "null").is("access_token_revoked_at", null),
    supabase.from("property_contributions").select("id", { count: "exact", head: true }).eq("status", "pending"),
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
  const cashTransactions = (cashResult.data ?? []) as CashTransactionRow[];
  const contributions = (contributionsResult.data ?? []) as ContributionRow[];
  const currentPeriodContributions = (currentPeriodContributionsResult.data ?? []) as ContributionPeriodRow[];
  const activities = (activitiesResult.data ?? []) as AdminActivityRow[];
  const issuedDocuments = (issuedDocumentsResult.data ?? []) as IssuedDocumentRow[];
  const adminUsers = (adminUsersResult.data ?? []) as AdminUserRow[];
  const staff = (staffResult.data ?? []) as StaffRow[];
  const specs = (specsResult.data ?? []) as SpecRow[];
  const plans = (plansResult.data ?? []) as PlanRow[];
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const homeLink = typeof params.homeLink === "string" && /^https?:\/\//.test(params.homeLink) ? params.homeLink : "";
  const pendingSubmissions = submissions.filter((submission) => isPending(submission.status));
  const pendingRequests = requests.filter((request) => isPending(request.status));
  const pendingSubmissionCount = pendingSubmissionsCountResult.count ?? pendingSubmissions.length;
  const pendingRequestCount = pendingRequestsCountResult.count ?? pendingRequests.length;
  const issuableRequestCount = issuableRequestsCountResult.count ?? requests.filter((request) => request.status === "approved").length;
  const actionableRequestCount = pendingRequestCount + issuableRequestCount;
  const activePropertyLinkCount = activePropertyLinksCountResult.count ?? properties.filter((property) => property.access_token_created_at && !property.access_token_revoked_at).length;
  const pendingContributionCount = pendingContributionsCountResult.count ?? contributions.filter((contribution) => contribution.status === "pending").length;
  const currentPeriodSummary = currentPeriodContributions.reduce((summary, contribution) => ({
    ...summary,
    [contribution.status]: summary[contribution.status] + 1,
    paidAmount: summary.paidAmount + (contribution.status === "paid" ? contribution.amount_rupiah : 0),
  }), { paid: 0, pending: 0, waived: 0, paidAmount: 0 });
  const documentsReady = isDocumentReady(settings);
  const reviewableSubmissions = submissions;
  const orderedSubmissions = [...reviewableSubmissions].sort((left, right) => reviewPriority(left.status) - reviewPriority(right.status));
  const actionableRequests = requests.filter((request) => isPending(request.status) || request.status === "approved");
  const orderedRequests = [...actionableRequests].sort((left, right) => reviewPriority(left.status) - reviewPriority(right.status));
  const cashBalance = cashTransactions.reduce((total, transaction) => total + (transaction.direction === "income" ? transaction.amount_rupiah : -transaction.amount_rupiah), 0);
  const lastCashTransaction = cashTransactions[0]?.transaction_date ?? null;
  const loadErrors = [
    feesResult.error && "jadwal iuran",
    announcementsResult.error && "pengumuman",
    resourcesResult.error && "tautan layanan",
    sectionsResult.error && "panduan",
    settingsResult.error && "pengaturan surat",
    submissionsResult.error && "pendataan warga",
    requestsResult.error && "permohonan surat",
    propertiesResult.error && "data rumah",
    cashResult.error && "pembukuan Kas",
    contributionsResult.error && "iuran rumah",
    currentPeriodContributionsResult.error && "ringkasan iuran periode berjalan",
    activitiesResult.error && "aktivitas operasional",
    issuedDocumentsResult.error && "arsip surat",
    adminUsersResult.error && "akses pengurus",
    pendingSubmissionsCountResult.error && "jumlah antrean pendataan",
    pendingRequestsCountResult.error && "jumlah antrean surat",
    issuableRequestsCountResult.error && "jumlah surat siap terbit",
    activePropertyLinksCountResult.error && "jumlah tautan rumah aktif",
    pendingContributionsCountResult.error && "jumlah iuran rumah tertunda",
    staffResult.error && "data petugas",
    specsResult.error && "spesifikasi rumah",
    plansResult.error && "denah",
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-6 border-b border-line pb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="border-l-2 border-brand pl-5"><p className="text-sm font-semibold text-brand">Ruang kerja RT</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.06em] text-ink sm:text-4xl">Prioritas warga, jelas dalam sekali lihat.</h1><p className="mt-3 text-sm leading-6 text-ink-muted">Masuk sebagai {context.email}. Selesaikan antrean terlebih dahulu, lalu perbarui informasi portal bila diperlukan.</p></div>
        <form action={signOut}><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"><SignOut size={17} weight="bold" aria-hidden="true" /> Keluar</button></form>
      </div>
      {message ? <p className="mt-6 flex items-center gap-2 border-l-2 border-brand bg-brand-soft px-4 py-4 text-sm font-bold text-ink" role="status"><CheckCircle size={20} weight="fill" className="text-brand" aria-hidden="true" />{message}</p> : null}
      {homeLink ? <p className="mt-4 break-all border-l-2 border-brand bg-surface-subtle px-4 py-4 text-sm leading-6 text-ink"><strong className="text-ink">Tautan privat baru:</strong> <a className="font-bold text-brand-deep hover:text-brand" href={homeLink}>{homeLink}</a></p> : null}
      {loadErrors.length ? <DataLoadWarning labels={loadErrors} /> : null}
      {!loadErrors.length && (!fees.length || !resources.length || !sections.length) ? <p className="mt-6 border-l-2 border-warm bg-warm px-4 py-4 text-sm leading-6 text-ink-muted">Konten awal belum ada di database. Jalankan <code className="rounded bg-surface px-1.5 py-0.5 text-ink">supabase/schema.sql</code> lalu <code className="rounded bg-surface px-1.5 py-0.5 text-ink">supabase/seed.sql</code> agar editor ini terisi.</p> : null}
      <AdminOverview pendingSubmissions={pendingSubmissionCount} pendingRequests={pendingRequestCount} pendingContributions={pendingContributionCount} issuableRequests={issuableRequestCount} activePropertyLinks={activePropertyLinkCount} documentsReady={documentsReady} cashBalance={cashBalance} lastCashTransaction={lastCashTransaction} />
      <Link href="/admin/peta-rumah" className="group mt-7 grid gap-5 border-y border-line py-5 transition-colors hover:border-brand sm:grid-cols-[minmax(0,1fr)_repeat(4,auto)] sm:items-end sm:gap-8"><div><p className="text-sm font-extrabold text-brand-deep">OPAL Atlas</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.05em] text-ink">Peta rumah operasional</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Telusuri denah, fokus pada satu rumah, dan perbarui profil tanpa meninggalkan konteks lingkungan.</p></div><AtlasMetric label="Rumah" value={properties.length} /><AtlasMetric label="Perlu review" value={properties.filter((property) => property.resident_submissions.some((submission) => isPending(submission.status))).length} /><AtlasMetric label="Iuran tertunda" value={pendingContributionCount} /><span className="inline-flex min-h-11 items-center justify-center rounded-full bg-action px-4 text-sm font-extrabold text-on-action transition group-hover:bg-brand">Buka peta</span></Link>

      <div className="mt-9 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <AdminNavigation />
        <div className="mt-8 grid gap-10 lg:mt-0">
        <section id="antrean" className="scroll-mt-28"><SectionHeading icon="users" title="Antrean operasional" description="Semua pendataan yang belum selesai serta surat yang siap diterbitkan ditampilkan di sini. Surat yang sudah disetujui selalu muncul paling atas agar dapat segera diterbitkan." /><p className="mt-3 text-sm leading-6 text-ink-muted">Angka tindakan dan daftar di bawah memakai sumber data aktif yang sama, sehingga pekerjaan tertunda tidak tersembunyi oleh riwayat lama.</p><div className="mt-5 grid gap-8 xl:grid-cols-2"><div><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-ink">Pendataan warga</h3><p className="text-sm font-bold text-brand-deep">{pendingSubmissionCount} perlu tindakan</p></div><div className="grid gap-4">{orderedSubmissions.map((submission) => <ResidentReviewForm key={submission.id} submission={submission} />)}{!reviewableSubmissions.length ? <EmptyQueue label="Tidak ada pendataan lengkap yang perlu diperiksa." /> : null}</div></div><div><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-extrabold text-ink">Permohonan surat</h3><p className="text-sm font-bold text-brand-deep">{actionableRequestCount} perlu tindakan</p></div><div className="grid gap-4">{orderedRequests.map((request) => <ServiceRequestReviewForm key={request.id} request={request} />)}{!actionableRequests.length ? <EmptyQueue label="Tidak ada permohonan surat yang perlu diproses." /> : null}</div></div></div></section>
        <section id="aktivitas" className="scroll-mt-28"><SectionHeading icon="gear" title="Aktivitas operasional" description="Kronologi terbaru tanpa menampilkan KTP, KK, atau isi pengajuan warga." /><AdminActivityFeed activities={activities} /></section>
        <section id="surat" className="scroll-mt-28"><SectionHeading icon="stamp" title="Penerbitan surat" description="Isi identitas penerbit sekali. Sistem baru membuka nomor surat saat seluruh data resmi sudah lengkap." /><div className="mt-5"><DocumentSettingsForm settings={settings} /></div></section>
        <AdminDisclosure id="arsip-surat" icon="stamp" title="Arsip surat" description="Dokumen yang sudah diterbitkan tetap tersedia secara privat untuk diunduh atau dicetak ulang oleh pengurus.">
          <IssuedDocumentsArchive documents={issuedDocuments} />
        </AdminDisclosure>
        <AdminDisclosure id="rumah" icon="house" title="Rumah & akses privat" description="Lihat kesiapan data dan catatan iuran per rumah, lalu buat, putar, atau cabut tautan privat. Tautan tidak pernah membuka KTP atau KK.">
          {properties.length ? <AdminPropertyDirectory properties={properties} /> : <EmptyQueue label="Data rumah akan muncul setelah migrasi atau pendataan pertama." />}
        </AdminDisclosure>
        <AdminDisclosure id="kas" icon="cash" title="Kas OPAL" description="Simpan pemasukan atau pengeluaran sebagai transaksi terstruktur, lalu tentukan apakah ringkasannya tampil untuk warga." defaultOpen>
          <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]"><CashTransactionForm /><CashTransactionLedger transactions={cashTransactions} /></div>
        </AdminDisclosure>
        <AdminDisclosure id="iuran" icon="gear" title="Iuran aktif" description="Menyimpan nominal membuat jadwal baru sehingga riwayat iuran sebelumnya tetap tersimpan.">
          <div className="grid gap-4 lg:grid-cols-2">{fees.filter((fee) => fee.is_active).map((fee) => <FeeForm key={fee.id} fee={fee} />)}</div>
        </AdminDisclosure>
        <AdminDisclosure id="iuran-rumah" icon="house" title="Iuran per rumah" description={`${pendingContributionCount} catatan iuran historis masih berstatus tertunda. Gunakan ringkasan periode berjalan untuk pekerjaan bulan ini.`}>
          <ContributionLedger properties={properties} contributions={contributions} currentPeriod={currentPeriod} currentPeriodSummary={currentPeriodSummary} />
        </AdminDisclosure>
        <AdminDisclosure id="pengumuman" icon="gear" title="Pengumuman" description="Gunakan satu pengumuman yang dipin untuk informasi paling penting di beranda.">
          <div className="grid gap-4 lg:grid-cols-2">{announcements.map((announcement) => <AnnouncementForm key={announcement.id} announcement={announcement} />)}<AnnouncementForm /></div>
        </AdminDisclosure>
        <AdminDisclosure id="layanan" icon="gear" title="Tautan layanan" description="Tautan tetap menuju sumber aslinya. Tandai bila warga perlu login Google.">
          <div className="grid gap-4 lg:grid-cols-2">{resources.map((resource) => <ResourceForm key={resource.id} resource={resource} />)}<ResourceForm /></div>
        </AdminDisclosure>
        <AdminDisclosure id="panduan" icon="wrench" title="Panduan harmonis" description="Gunakan Markdown sederhana. HTML mentah tidak akan dirender pada halaman warga.">
          <div className="grid gap-5">{sections.map((section) => <GuideForm key={section.id} section={section} />)}</div>
        </AdminDisclosure>
        <AdminDisclosure id="fasilitas" icon="wrench" title="Petugas, spesifikasi, dan denah" description="Kelola informasi operasional warga. Denah disimpan terpisah dari berkas identitas.">
          <div className="grid gap-8"><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Petugas</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{staff.map((item) => <StaffForm key={item.id} staff={item} />)}<StaffForm /></div></div><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Spesifikasi rumah</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{specs.map((item) => <SpecForm key={item.id} spec={item} />)}<SpecForm /></div></div><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Denah</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{plans.map((item) => <PlanForm key={item.id} plan={item} />)}<PlanForm /></div></div></div>
        </AdminDisclosure>
        <AdminDisclosure id="pengurus" icon="gear" title="Akses pengurus" description="Kelola email yang boleh membuka ruang kerja RT. Akun email dan password tetap dibuat melalui Supabase Authentication.">
          <AdminUsersPanel users={adminUsers} currentEmail={context.email} />
        </AdminDisclosure>
        </div>
      </div>
    </div>
  );
}

function SetupState() {
  return <div className="mx-auto flex min-h-[58vh] max-w-[1440px] items-center px-5 py-14 sm:px-8 lg:px-10"><div className="max-w-2xl border-l-2 border-brand bg-surface-subtle px-7 py-8 sm:px-9 sm:py-10"><GearSix size={35} weight="fill" className="text-brand" aria-hidden="true" /><p className="mt-7 text-sm font-semibold text-brand">Pengaturan diperlukan</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.055em] text-ink">Admin siap setelah Supabase dihubungkan.</h1><p className="mt-4 leading-7 text-ink-muted">Tambahkan variabel lingkungan Supabase, terapkan skema dan data awal, lalu buat akun RT di Supabase Authentication dan daftarkan emailnya pada tabel admin_users. Konten publik tetap menampilkan versi bawaan sampai database terhubung.</p></div></div>;
}

function SectionHeading({ icon, title, description }: { icon: AdminSectionIcon; title: string; description: string }) {
  const Icon = icon === "gear" ? GearSix : icon === "stamp" ? Stamp : icon === "users" ? UsersThree : icon === "house" ? HouseLine : icon === "cash" ? Receipt : Wrench;
  return <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-soft text-brand-deep"><Icon size={23} weight="fill" aria-hidden="true" /></span><div><h2 className="text-2xl font-extrabold tracking-[-0.05em] text-ink">{title}</h2><p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p></div></div>;
}

function DataLoadWarning({ labels }: { labels: string[] }) {
  return <section className="mt-6 border-l-2 border-danger bg-danger-soft px-4 py-4 text-sm leading-6 text-danger-deep" role="alert"><p className="font-extrabold">Sebagian data tidak dapat dimuat.</p><p className="mt-1">Periksa koneksi Supabase atau skema database untuk: {labels.join(", ")}. Jangan menganggap bagian yang kosong sebagai data nol.</p><a href="/admin" className="mt-3 inline-flex min-h-10 items-center rounded-full border border-danger px-3.5 text-sm font-bold hover:bg-surface-raised">Muat ulang dashboard</a></section>;
}

function AdminOverview({ pendingSubmissions, pendingRequests, pendingContributions, issuableRequests, activePropertyLinks, documentsReady, cashBalance, lastCashTransaction }: { pendingSubmissions: number; pendingRequests: number; pendingContributions: number; issuableRequests: number; activePropertyLinks: number; documentsReady: boolean; cashBalance: number; lastCashTransaction: string | null }) {
  const pendingTotal = pendingSubmissions + pendingRequests + pendingContributions;
  return <section aria-labelledby="admin-overview" className="mt-9 border-y border-line"><h2 id="admin-overview" className="sr-only">Ringkasan kerja RT</h2><div className="grid lg:grid-cols-[1.55fr_repeat(4,minmax(0,1fr))]"><a href="#antrean" className="group border-b border-line px-0 py-6 transition-colors hover:text-brand lg:border-b-0 lg:pr-8"><p className="text-sm font-extrabold text-brand-deep">Perlu ditindaklanjuti</p><div className="mt-3 flex items-end justify-between gap-4"><p className="text-5xl font-extrabold tracking-[-0.08em] text-ink">{pendingTotal}</p><span className="mb-1 text-sm font-bold text-brand-deep group-hover:text-brand">Buka antrean</span></div><p className="mt-3 text-sm leading-6 text-ink-muted">{pendingSubmissions} pendataan, {pendingRequests} surat, dan {pendingContributions} iuran rumah perlu dicek.</p></a><a href="#surat" className="group border-b border-line py-6 lg:border-b-0 lg:border-l lg:px-7"><p className="text-sm font-extrabold text-ink">Siap diterbitkan</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-ink">{issuableRequests}</p><p className="mt-3 text-sm leading-6 text-ink-muted">{issuableRequests ? "Surat telah disetujui dan menunggu nomor PDF." : "Belum ada surat yang menunggu penerbitan."}</p></a><a href="#surat" className="group border-b border-line py-6 lg:border-b-0 lg:border-l lg:px-7"><p className="text-sm font-extrabold text-ink">Penerbitan surat</p><p className="mt-3 text-lg font-extrabold tracking-[-0.04em] text-ink">{documentsReady ? "Siap digunakan" : "Perlu dilengkapi"}</p><p className="mt-3 text-sm leading-6 text-ink-muted">{documentsReady ? "Nomor surat dapat diterbitkan oleh pengurus." : "Lengkapi identitas RT sebelum menerbitkan surat."}</p></a><a href="#kas" className="group border-b border-line py-6 lg:border-b-0 lg:border-l lg:px-7"><p className="text-sm font-extrabold text-ink">Saldo pencatatan Kas</p><p className="mt-3 text-xl font-extrabold tracking-[-0.05em] text-ink">{formatRupiah(cashBalance)}</p><p className="mt-3 text-sm leading-6 text-ink-muted">{lastCashTransaction ? `Transaksi terakhir ${formatAdminDate(lastCashTransaction)}.` : "Belum ada transaksi yang dicatat."}</p></a><a href="#rumah" className="group py-6 lg:border-l lg:px-7"><p className="text-sm font-extrabold text-ink">Tautan rumah aktif</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-ink">{activePropertyLinks}</p><p className="mt-3 text-sm leading-6 text-ink-muted">Akses privat yang masih dapat dipakai warga.</p></a></div></section>;
}

function AdminNavigation() {
  const links = [["antrean", "Antrean"], ["aktivitas", "Aktivitas"], ["surat", "Surat"], ["arsip-surat", "Arsip surat"], ["kas", "Kas"], ["peta-rumah", "Peta Rumah"], ["rumah", "Rumah"], ["iuran", "Iuran aktif"], ["iuran-rumah", "Iuran rumah"], ["pengumuman", "Pengumuman"], ["layanan", "Layanan"], ["panduan", "Panduan"], ["fasilitas", "Fasilitas"], ["pengurus", "Pengurus"]] as const;
  return <nav aria-label="Bagian admin" className="-mx-5 flex gap-1 overflow-x-auto border-y border-line bg-surface px-5 py-2 sm:mx-0 sm:px-0 lg:sticky lg:top-24 lg:mx-0 lg:h-fit lg:flex-col lg:gap-0 lg:overflow-visible lg:border-0 lg:bg-transparent lg:px-0 lg:py-0"><p className="sr-only lg:not-sr-only lg:mb-3 lg:px-3 lg:text-xs lg:font-extrabold lg:uppercase lg:tracking-[0.14em] lg:text-ink-faint">Navigasi</p>{links.map(([id, label]) => <a key={id} href={id === "peta-rumah" ? "/admin/peta-rumah" : `#${id}`} className="shrink-0 rounded-lg px-3 py-2.5 text-sm font-bold text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{label}</a>)}</nav>;
}

function AtlasMetric({ label, value }: { label: string; value: number }) {
  return <span className="block sm:text-right"><span className="block text-2xl font-extrabold tracking-[-0.06em] text-ink">{value}</span><span className="mt-1 block text-xs font-bold text-ink-muted">{label}</span></span>;
}

function AdminActivityFeed({ activities }: { activities: AdminActivityRow[] }) {
  return <div className="mt-5 border-t border-line">{activities.length ? activities.map((activity) => <article key={activity.id} className="grid gap-2 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="font-extrabold text-ink">{activity.action}</p><p className="mt-1 text-sm text-ink-muted">{activity.actor_email === "Warga" ? "Oleh warga OPAL" : `Oleh ${activity.actor_email}`}</p></div><time dateTime={activity.created_at} className="text-sm font-bold text-ink-faint sm:text-right">{formatAdminDateTime(activity.created_at)}</time></article>) : <EmptyQueue label="Aktivitas akan muncul saat warga mengirim data atau pengurus melakukan perubahan." />}</div>;
}

function AdminDisclosure({ id, icon, title, description, children, defaultOpen = false }: { id: string; icon: AdminSectionIcon; title: string; description: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return <section id={id} className="scroll-mt-28"><details className="group border-t border-line pt-7" open={defaultOpen}><summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden"><SectionHeading icon={icon} title={title} description={description} /><span className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink-muted transition group-open:rotate-180 group-open:border-brand group-open:text-brand" aria-hidden="true"><CaretDown size={19} weight="bold" /></span></summary><div className="mt-5">{children}</div></details></section>;
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

function unitFrom(value: ResidentSubmissionRow["properties"] | ServiceRequestRow["properties"] | ContributionRow["properties"]) {
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
  const unit = unitFrom(submission.properties);
  const message = reviewMessage({ name: String(payload.responsibleName ?? "Warga OPAL"), unit, status: submission.status, note: submission.admin_note, subject: "pendataan rumah" });
  const feedback = [
    { label: "Feedback lingkungan", value: typeof payload.environmentFeedback === "string" ? payload.environmentFeedback.trim() : "" },
    { label: "Feedback untuk pengurus", value: typeof payload.managementFeedback === "string" ? payload.managementFeedback.trim() : "" },
  ].filter((item) => item.value.length > 0);
  return <article className="rounded-[18px] border border-line bg-surface-raised p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><FileLock size={21} weight="fill" className="mt-0.5 shrink-0 text-brand" aria-hidden="true" /><div className="min-w-0"><p className="font-extrabold text-ink">{unit}</p><p className="mt-1 text-sm text-ink-muted">Masuk {formatAdminDate(submission.created_at)}</p></div></div><StatusBadge status={submission.status} /></div><dl className="mt-4 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2"><div><dt className="text-ink-faint">Penanggung jawab</dt><dd className="font-bold text-ink">{String(payload.responsibleName ?? "-")}</dd></div><div><dt className="text-ink-faint">Jumlah penghuni</dt><dd className="font-bold text-ink">{String(payload.occupantsCount ?? "-")}</dd></div></dl><details className="mt-4 border-y border-line py-3"><summary className="cursor-pointer text-sm font-bold text-brand-deep">Lihat data pendataan dan feedback</summary><dl className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2"><div><dt className="text-ink-faint">Status rumah</dt><dd className="mt-0.5 font-bold text-ink">{residentStatusLabels[String(payload.houseStatus ?? "")] ?? "-"}</dd></div><div><dt className="text-ink-faint">Domisili penanggung jawab</dt><dd className="mt-0.5 font-bold text-ink">{String(payload.responsibleAddress ?? "-")}</dd></div><div><dt className="text-ink-faint">Kepala keluarga</dt><dd className="mt-0.5 font-bold text-ink">{String(payload.headOfHouseholdName ?? "-")}</dd></div><div><dt className="text-ink-faint">Pekerjaan kepala keluarga</dt><dd className="mt-0.5 font-bold text-ink">{occupationLabels[String(payload.headOfHouseholdOccupation ?? "")] ?? "-"}</dd></div><div><dt className="text-ink-faint">Email</dt><dd className="mt-0.5 break-words font-bold text-ink">{String(payload.email ?? "-")}</dd></div><div><dt className="text-ink-faint">WhatsApp</dt><dd className="mt-0.5 font-bold text-ink">{whatsapp || "-"}</dd></div></dl>{feedback.length ? <div className="mt-4 border-t border-line pt-4">{feedback.map((item) => <div key={item.label} className="mb-4 last:mb-0"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ink-faint">{item.label}</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">{item.value}</p></div>)}</div> : <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">Warga tidak menyampaikan feedback tambahan.</p>}</details><div className="mt-4 flex flex-wrap gap-2">{submission.resident_evidence.map((evidence) => <a key={evidence.id} href={`/api/admin/evidence/${evidence.id}`} target="_blank" rel="noreferrer" className="rounded-full border border-line px-3 py-1.5 text-xs font-bold text-brand-deep hover:border-brand hover:text-brand">{evidence.evidence_kind === "family_card" ? "Buka KK" : "Buka KTP"}</a>)}</div>{whatsapp ? <div className="mt-4"><p className="mb-2 text-xs font-bold text-ink-faint">Pesan mengikuti status dan catatan yang sudah tersimpan.</p><WhatsAppActions phone={whatsapp} message={message} /></div> : null}<form action={reviewResidentSubmission} className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={submission.id} /><div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><Field label="Status"><select name="status" defaultValue={submission.status === "submitted" ? "in_review" : submission.status} className={inputClass}><option value="in_review">Sedang diperiksa</option><option value="needs_revision">Perlu revisi</option><option value="approved">Setujui dan sahkan data rumah</option><option value="rejected">Tolak</option></select></Field><Field label="Catatan RT"><input name="adminNote" defaultValue={submission.admin_note ?? ""} className={inputClass} /></Field></div><button className="mt-4 inline-flex min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan review</button></form></article>;
}

function ServiceRequestReviewForm({ request }: { request: ServiceRequestRow }) {
  const title = request.request_type === "move" ? "Pindah rumah" : request.request_type === "domicile" ? "Domisili" : "Belum menikah";
  const unit = unitFrom(request.properties);
  const message = reviewMessage({ name: request.contact_name, unit, status: request.status, note: request.admin_note, subject: `permohonan surat ${title.toLowerCase()}` });
  return <article className="rounded-[18px] border border-line bg-surface-raised p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-extrabold text-ink">{title}, {unit}</p><p className="mt-1 text-sm text-ink-muted">{request.contact_name}, masuk {formatAdminDate(request.created_at)}</p></div><StatusBadge status={request.status} /></div><details className="mt-4 border-y border-line py-3"><summary className="cursor-pointer text-sm font-bold text-brand-deep">Lihat data pengajuan</summary><dl className="mt-3 grid gap-3 text-sm">{Object.entries(request.payload).filter(([key]) => key !== "website").map(([key, value]) => <div key={key} className="grid gap-1 sm:grid-cols-[0.42fr_1fr]"><dt className="text-ink-faint">{requestFieldLabel(key)}</dt><dd className="break-words font-medium text-ink">{String(value)}</dd></div>)}</dl></details><div className="mt-4"><WhatsAppActions phone={request.contact_whatsapp} message={message} /></div><form action={reviewServiceRequest} className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={request.id} /><div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><Field label="Status"><select name="status" defaultValue={request.status === "submitted" ? "in_review" : request.status} className={inputClass}><option value="in_review">Sedang diperiksa</option><option value="needs_revision">Perlu revisi</option><option value="approved">Setujui untuk diterbitkan</option><option value="rejected">Tolak</option></select></Field><Field label="Catatan RT"><input name="adminNote" defaultValue={request.admin_note ?? ""} className={inputClass} /></Field></div><button className="mt-4 inline-flex min-h-10 rounded-full bg-ink px-4 text-sm font-bold text-ink-inverse hover:bg-brand">Simpan review</button></form>{request.status === "approved" ? <form action={issueServiceRequest} className="mt-3"><input type="hidden" name="id" value={request.id} /><button className="inline-flex min-h-10 rounded-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-deep">Terbitkan PDF bernomor</button></form> : null}</article>;
}

function IssuedDocumentsArchive({ documents }: { documents: IssuedDocumentRow[] }) {
  const labels = { move: "Pindah rumah", domicile: "Domisili", single: "Belum menikah" };
  return <section aria-labelledby="issued-documents-heading"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h3 id="issued-documents-heading" className="text-lg font-extrabold tracking-[-0.035em] text-ink">Dokumen diterbitkan</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Arsip disimpan privat. Unduhan hanya tersedia untuk pengurus yang sedang masuk.</p></div><p className="text-sm font-bold text-ink-muted">{documents.length} arsip</p></div>{documents.length ? <div className="mt-5 border-t border-line">{documents.map((document) => { const request = Array.isArray(document.service_requests) ? document.service_requests[0] : document.service_requests; const unit = request ? unitFrom(request.properties) : "Rumah belum cocok"; return <article key={document.id} className="grid gap-3 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="font-extrabold text-ink">{document.document_number}</p><p className="mt-1 text-sm text-ink-muted">{request ? `${labels[request.request_type]}, ${unit}, ${request.contact_name}` : "Permohonan asal tidak tersedia"}</p><p className="mt-1 text-xs font-bold text-ink-faint">Diterbitkan {formatAdminDate(document.issued_at)}</p></div><a href={`/api/admin/surat/${document.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-full border border-line px-4 text-sm font-bold text-brand-deep transition hover:border-brand hover:text-brand">Unduh PDF</a></article>; })}</div> : <EmptyQueue label="Belum ada surat resmi yang diterbitkan." />}</section>;
}

function PropertyContributionForm({ contribution }: { contribution?: ContributionRow }) {
  const unit = contribution ? unitFrom(contribution.properties) : "";
  const periodMonth = contribution?.period?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const paidAt = contribution?.paid_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return <form action={savePropertyContribution} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><input type="hidden" name="id" value={contribution?.id ?? ""} />{contribution ? <div className="border-l-2 border-brand bg-brand-soft px-3 py-2 text-sm font-extrabold text-brand-deep">{unit}</div> : <Field label="Unit rumah"><input name="unitCode" list="opal-property-units" placeholder="Pilih atau ketik kode unit" required className={inputClass} /></Field>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Kategori"><input name="category" defaultValue={contribution?.category ?? "Iuran Kas OPAL"} required className={inputClass} /></Field><Field label="Periode"><input name="periodMonth" type="month" defaultValue={periodMonth} required className={inputClass} /></Field><Field label="Nominal (Rp)"><input name="amountRupiah" type="number" min="1" step="1" defaultValue={contribution?.amount_rupiah ?? 25000} required className={inputClass} /></Field><Field label="Status"><select name="status" defaultValue={contribution?.status ?? "paid"} className={inputClass}><option value="paid">Sudah dibayar</option><option value="pending">Belum dibayar</option><option value="waived">Dibebaskan</option></select></Field><Field label="Tanggal bayar"><input name="paidAt" type="date" defaultValue={paidAt} className={inputClass} /></Field></div><p className="mt-3 text-xs leading-5 text-ink-faint">Tanggal bayar hanya digunakan saat statusnya “Sudah dibayar”.</p><button className="mt-5 inline-flex min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:bg-brand">{contribution ? "Simpan perubahan" : "Catat iuran rumah"}</button></form>;
}

function BulkContributionForm() {
  const periodMonth = new Date().toISOString().slice(0, 7);
  return <details className="mt-4 border-t border-line pt-4"><summary className="cursor-pointer text-sm font-bold text-brand-deep">Siapkan iuran untuk seluruh rumah aktif</summary><form action={prepareMonthlyContributions} className="mt-4"><p className="max-w-xl text-sm leading-6 text-ink-muted">Sistem hanya membuat catatan baru yang belum ada pada periode ini dan selalu berstatus <strong className="font-bold text-ink">belum dibayar</strong>. Ini tidak membuat transaksi Kas atau menandai pembayaran warga.</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Kategori"><input name="category" defaultValue="Iuran Kas OPAL" required className={inputClass} /></Field><Field label="Nominal (Rp)"><input name="amountRupiah" type="number" min="1" step="1" defaultValue={25000} required className={inputClass} /></Field><Field label="Periode"><input name="periodMonth" type="month" defaultValue={periodMonth} required className={inputClass} /></Field></div><button className="mt-5 inline-flex min-h-11 rounded-full border border-line px-5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand">Siapkan tagihan tertunda</button></form></details>;
}

function ContributionLedger({ properties, contributions, currentPeriod, currentPeriodSummary }: { properties: PropertyRow[]; contributions: ContributionRow[]; currentPeriod: string; currentPeriodSummary: { paid: number; pending: number; waived: number; paidAmount: number } }) {
  return <div><section aria-labelledby="current-contribution-heading" className="border-y border-line py-5"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h3 id="current-contribution-heading" className="text-lg font-extrabold tracking-[-0.035em] text-ink">Periode berjalan</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Catatan iuran untuk {formatAdminMonth(currentPeriod)}. Angka ini tidak mencampur periode terdahulu.</p></div><p className="text-sm font-bold text-brand-deep">{currentPeriodSummary.paid + currentPeriodSummary.pending + currentPeriodSummary.waived} catatan</p></div><dl className="mt-5 grid border-t border-line sm:grid-cols-4"><div className="border-b border-line py-4 sm:border-b-0 sm:pr-5"><dt className="text-sm font-bold text-ink-muted">Sudah dibayar</dt><dd className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-ink">{currentPeriodSummary.paid}</dd></div><div className="border-b border-line py-4 sm:border-b-0 sm:border-l sm:px-5"><dt className="text-sm font-bold text-ink-muted">Belum dibayar</dt><dd className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-ink">{currentPeriodSummary.pending}</dd></div><div className="border-b border-line py-4 sm:border-b-0 sm:border-l sm:px-5"><dt className="text-sm font-bold text-ink-muted">Dibebaskan</dt><dd className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-ink">{currentPeriodSummary.waived}</dd></div><div className="py-4 sm:border-l sm:pl-5"><dt className="text-sm font-bold text-ink-muted">Pembayaran tercatat</dt><dd className="mt-2 text-xl font-extrabold tracking-[-0.05em] text-ink">{formatRupiah(currentPeriodSummary.paidAmount)}</dd></div></dl></section><div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]"><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Catat iuran</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Satu catatan untuk satu rumah, kategori, dan periode. Gunakan status tertunda bila pembayaran belum diterima.</p><div className="mt-5"><PropertyContributionForm /></div><BulkContributionForm /><datalist id="opal-property-units">{properties.map((property) => <option key={property.id} value={property.unit_code} />)}</datalist></div><section aria-labelledby="contribution-ledger-heading" className="border-t border-line pt-5 xl:border-t-0 xl:border-l xl:pl-8"><div className="flex items-baseline justify-between gap-4"><div><h3 id="contribution-ledger-heading" className="text-lg font-extrabold tracking-[-0.035em] text-ink">Catatan terbaru</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Buka satu baris untuk mengoreksi status atau nominal.</p></div><p className="text-sm font-bold text-ink-muted">{contributions.length} terbaru</p></div>{contributions.length ? <div className="mt-4 border-t border-line">{contributions.map((contribution) => <article key={contribution.id} className="border-b border-line py-4"><details><summary className="grid cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden sm:grid-cols-[minmax(0,1fr)_auto_auto]"><div><p className="font-extrabold text-ink">{unitFrom(contribution.properties)}</p><p className="mt-1 text-sm text-ink-muted">{contribution.category}, {contribution.period ? formatAdminDate(contribution.period) : "Periode belum dicatat"}</p></div><StatusBadge status={contribution.status} /><p className="font-extrabold tracking-[-0.03em] text-ink sm:text-right">{formatRupiah(contribution.amount_rupiah)}</p></summary><div className="mt-5"><PropertyContributionForm contribution={contribution} /></div></details></article>)}</div> : <EmptyQueue label="Belum ada iuran per rumah yang dicatat." />}</section></div></div>;
}

function CashTransactionForm({ transaction }: { transaction?: CashTransactionRow }) {
  return <form action={saveCashTransaction} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><input type="hidden" name="id" value={transaction?.id ?? ""} /><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">{transaction ? "Koreksi transaksi" : "Catat transaksi"}</h3><p className="mt-1 text-sm leading-6 text-ink-muted">{transaction ? "Nilai sebelumnya disimpan sebagai riwayat internal sebelum perubahan diterapkan." : "Masukkan sesuai bukti pembukuan agar saldo dashboard tetap akurat."}</p></div>{transaction ? <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-extrabold text-ink-muted">Koreksi</span> : null}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Tanggal transaksi"><input name="transactionDate" type="date" defaultValue={transaction?.transaction_date ?? new Date().toISOString().slice(0, 10)} required className={inputClass} /></Field><Field label="Arah"><select name="direction" defaultValue={transaction?.direction ?? "income"} className={inputClass}><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></Field><Field label="Kategori"><input name="category" defaultValue={transaction?.category} placeholder="Contoh: Iuran warga" required className={inputClass} /></Field><Field label="Nominal (Rp)"><input name="amountRupiah" type="number" min="1" step="1" defaultValue={transaction?.amount_rupiah} required className={inputClass} /></Field></div><Field label="Keterangan"><textarea name="description" defaultValue={transaction?.description} className={textareaClass} /></Field><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><Toggle name="isPublic" label="Tampilkan pada ringkasan Kas publik" checked={transaction?.is_public ?? true} /><button className="inline-flex min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse hover:bg-brand">{transaction ? "Simpan koreksi" : "Simpan transaksi"}</button></div></form>;
}

function CashTransactionLedger({ transactions }: { transactions: CashTransactionRow[] }) {
  return <section aria-labelledby="cash-ledger-heading" className="border-t border-line pt-5 xl:border-t-0 xl:border-l xl:pl-8"><div className="flex items-baseline justify-between gap-4"><div><h3 id="cash-ledger-heading" className="text-lg font-extrabold tracking-[-0.035em] text-ink">Transaksi terbaru</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Buka satu baris untuk memperbaiki catatannya.</p></div><p className="text-sm font-bold text-ink-muted">{transactions.length} total</p></div>{transactions.length ? <div className="mt-4 border-t border-line">{transactions.slice(0, 12).map((transaction) => <article key={transaction.id} className="border-b border-line py-4"><details><summary className="grid cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden sm:grid-cols-[minmax(0,1fr)_auto_auto]"><div><p className="font-extrabold text-ink">{transaction.category}</p><p className="mt-1 text-sm text-ink-muted">{formatAdminDate(transaction.transaction_date)}{transaction.description ? `, ${transaction.description}` : ""}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-extrabold ${transaction.direction === "income" ? "bg-brand-soft text-brand-deep" : "bg-danger-soft text-danger-deep"}`}>{transaction.direction === "income" ? "Masuk" : "Keluar"}</span><p className="font-extrabold tracking-[-0.03em] text-ink sm:text-right">{formatRupiah(transaction.amount_rupiah)}</p></summary><div className="mt-5"><CashTransactionForm transaction={transaction} /></div></details></article>)}</div> : <EmptyQueue label="Belum ada transaksi Kas yang dicatat." />}</section>;
}

function AdminUsersPanel({ users, currentEmail }: { users: AdminUserRow[]; currentEmail: string }) {
  return <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]"><form action={addAdminUser} className="rounded-[18px] border border-line bg-surface-raised p-5 sm:p-6"><h3 className="text-lg font-extrabold tracking-[-0.035em] text-ink">Tambah pengurus</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Masukkan email yang akan diberi akses. Pengurus tersebut juga harus memiliki akun email/password di Supabase Authentication.</p><Field label="Email pengurus"><input name="email" type="email" autoComplete="email" placeholder="pengurus@contoh.com" required className={inputClass} /></Field><button className="mt-5 inline-flex min-h-11 rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:bg-brand">Berikan akses admin</button></form><section aria-labelledby="admin-users-heading" className="border-t border-line pt-5 xl:border-t-0 xl:border-l xl:pl-8"><div className="flex items-baseline justify-between gap-3"><div><h3 id="admin-users-heading" className="text-lg font-extrabold tracking-[-0.035em] text-ink">Pengurus berakses</h3><p className="mt-1 text-sm leading-6 text-ink-muted">{users.length} email dapat masuk ke ruang kerja RT.</p></div></div><div className="mt-4 border-t border-line">{users.map((user) => { const isCurrent = user.email === currentEmail; return <article key={user.email} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4"><div className="min-w-0"><p className="break-all font-extrabold text-ink">{user.email}</p><p className="mt-1 text-sm text-ink-muted">Ditambahkan {formatAdminDate(user.created_at)}</p></div>{isCurrent ? <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-extrabold text-brand-deep">Akun Anda</span> : <form action={removeAdminUser}><input type="hidden" name="email" value={user.email} /><button className="min-h-10 rounded-full border border-line px-3.5 text-xs font-bold text-ink transition hover:border-danger hover:text-danger">Cabut akses</button></form>}</article>; })}</div></section></div>;
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
