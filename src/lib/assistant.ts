import { z } from "zod";
import type { PortalData } from "@/lib/content";
import { formatRupiah } from "@/lib/format";

export const MAX_ASSISTANT_MESSAGES = 8;
export const MAX_ASSISTANT_MESSAGE_LENGTH = 1_200;

export const assistantRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(MAX_ASSISTANT_MESSAGE_LENGTH),
  })).min(1).max(MAX_ASSISTANT_MESSAGES),
  path: z.string().max(160).optional(),
});

export type AssistantMessage = z.infer<typeof assistantRequestSchema>["messages"][number];
export type AssistantScope = "public" | "admin";

export type AssistantSource = {
  label: string;
  href: string;
};

export type AssistantDocument = {
  title: string;
  text: string;
  source: AssistantSource;
};

export type PublicCashSummaryForAssistant = {
  sourceStatus: "ready" | "unavailable";
  income: number;
  expense: number;
  balance: number;
  lastUpdated: string | null;
  categories: Array<{ category: string; income: number; expense: number }>;
};

export type CashTransactionForAssistant = {
  transaction_date: string;
  category: string;
  description: string;
  direction: "income" | "expense";
  amount_rupiah: number;
  is_public: boolean;
};

export type CashDateRange = {
  from: string | null;
  to: string | null;
  label: string;
};

const STOP_WORDS = new Set([
  "apa", "apakah", "bisa", "boleh", "dan", "dari", "di", "dengan", "ini", "itu", "ke", "untuk", "yang",
]);

function tokenize(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function textWithoutMarkdown(value: string) {
  return value
    .replace(/[#*_>`~-]/g, "")
    .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateRangeLabel(range: CashDateRange) {
  return range.label || "seluruh transaksi yang tersedia";
}

function jakartaMonthParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function monthRange(year: number, month: number, label: string): CashDateRange {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const to = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { from, to, label };
}

export function getCashDateRange(question: string, now = new Date()): CashDateRange {
  const normalized = question.toLocaleLowerCase("id-ID");
  const monthMatch = normalized.match(/\b(20\d{2})[-/]([01]?\d)\b/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month >= 1 && month <= 12) return monthRange(year, month, `${year}-${String(month).padStart(2, "0")}`);
  }

  const current = jakartaMonthParts(now);
  if (normalized.includes("bulan lalu")) {
    const month = current.month === 1 ? 12 : current.month - 1;
    const year = current.month === 1 ? current.year - 1 : current.year;
    return monthRange(year, month, "bulan lalu");
  }
  if (normalized.includes("bulan ini") || normalized.includes("bulan sekarang")) {
    return monthRange(current.year, current.month, "bulan ini");
  }
  if (normalized.includes("tahun ini") || normalized.includes("tahun sekarang")) {
    return { from: `${current.year}-01-01`, to: `${current.year + 1}-01-01`, label: `tahun ${current.year}` };
  }
  return { from: null, to: null, label: "seluruh transaksi yang tersedia" };
}

export function isCashQuestion(question: string) {
  return /\b(kas|iuran|saldo|transaksi|pemasukan|pengeluaran|keuangan|cctv|fogging)\b/i.test(question);
}

export function isRestrictedQuestion(question: string) {
  return /\b(ktp|kk|token|password|kata sandi|api key|secret|rahasia|privat|private|file bukti|bukti identitas|foto dokumen|storage_path)\b/i.test(question);
}

export function buildPublicAssistantDocuments(portal: PortalData, cash: PublicCashSummaryForAssistant): AssistantDocument[] {
  const documents: AssistantDocument[] = [];

  for (const fee of portal.fees) {
    documents.push({
      title: fee.label,
      text: `${fee.label}: ${formatRupiah(fee.amountRupiah)} ${fee.description} Metode pembayaran: ${fee.paymentMethod}. Tujuan: ${fee.destination}. Berlaku mulai ${fee.effectiveFrom}.`,
      source: { label: `Kas OPAL · ${fee.label}`, href: "/kas" },
    });
  }

  for (const section of portal.guideSections) {
    documents.push({
      title: section.title,
      text: `${section.summary}\n${section.bodyMarkdown}`,
      source: { label: `Panduan · ${section.title}`, href: `/panduan-harmonis#${section.slug}` },
    });
  }

  for (const announcement of portal.announcements) {
    documents.push({
      title: announcement.title,
      text: `${announcement.title}\n${announcement.body}`,
      source: { label: `Pengumuman · ${announcement.title}`, href: "/" },
    });
  }

  for (const resource of portal.resources) {
    documents.push({
      title: resource.title,
      text: `${resource.title}: ${resource.description}${resource.requiresGoogleLogin ? " Membutuhkan login Google." : ""}`,
      source: { label: `Layanan · ${resource.title}`, href: resource.href },
    });
  }

  if (cash.sourceStatus === "ready") {
    const categories = cash.categories.map((item) => `${item.category}: pemasukan ${formatRupiah(item.income)}, pengeluaran ${formatRupiah(item.expense)}`).join("; ");
    documents.push({
      title: "Ringkasan Kas OPAL publik",
      text: `Ringkasan transaksi yang ditandai publik. Pemasukan ${formatRupiah(cash.income)}, pengeluaran ${formatRupiah(cash.expense)}, saldo bersih ${formatRupiah(cash.balance)}. Pembaruan terakhir: ${cash.lastUpdated ?? "belum tersedia"}. Per kategori: ${categories || "belum tersedia"}.`,
      source: { label: "Kas OPAL publik", href: "/kas" },
    });
  }

  return documents;
}

export function selectRelevantDocuments(question: string, documents: AssistantDocument[], limit = 6) {
  const queryTokens = tokenize(question);
  if (!queryTokens.length) return [];

  return documents
    .map((document, index) => {
      const titleTokens = tokenize(document.title);
      const documentTokens = new Set(tokenize(`${document.title} ${document.text}`));
      const score = queryTokens.reduce((total, token) => total + (documentTokens.has(token) ? 1 : 0), 0)
        + queryTokens.reduce((total, token) => total + (titleTokens.includes(token) ? 2 : 0), 0);
      return { document, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.document);
}

export function summarizeCashTransactions(
  transactions: CashTransactionForAssistant[],
  question: string,
  source: AssistantSource,
  now = new Date(),
): AssistantDocument {
  const range = getCashDateRange(question, now);
  const filtered = transactions.filter((transaction) => {
    if (range.from && transaction.transaction_date < range.from) return false;
    if (range.to && transaction.transaction_date >= range.to) return false;
    return true;
  });
  const income = filtered.filter((item) => item.direction === "income").reduce((sum, item) => sum + item.amount_rupiah, 0);
  const expense = filtered.filter((item) => item.direction === "expense").reduce((sum, item) => sum + item.amount_rupiah, 0);
  const categoryMap = new Map<string, { income: number; expense: number }>();
  for (const item of filtered) {
    const totals = categoryMap.get(item.category) ?? { income: 0, expense: 0 };
    totals[item.direction] += item.amount_rupiah;
    categoryMap.set(item.category, totals);
  }
  const categories = [...categoryMap.entries()]
    .sort(([, a], [, b]) => b.income + b.expense - (a.income + a.expense))
    .slice(0, 12)
    .map(([category, totals]) => `${category}: masuk ${formatRupiah(totals.income)}, keluar ${formatRupiah(totals.expense)}`)
    .join("; ");
  const rows = filtered.slice(0, 40).map((item) => `${item.transaction_date} · ${item.direction === "income" ? "masuk" : "keluar"} · ${item.category} · ${formatRupiah(item.amount_rupiah)}${item.description ? ` · ${textWithoutMarkdown(item.description)}` : ""}`).join("\n");

  return {
    title: `Data Kas OPAL · ${formatDateRangeLabel(range)}`,
    text: `Periode: ${formatDateRangeLabel(range)}. Jumlah transaksi: ${filtered.length}. Total pemasukan: ${formatRupiah(income)}. Total pengeluaran: ${formatRupiah(expense)}. Saldo bersih periode: ${formatRupiah(income - expense)}. Kategori: ${categories || "belum ada"}.\nTransaksi yang relevan (maksimal 40):\n${rows || "Tidak ada transaksi pada periode ini."}`,
    source,
  };
}

export function buildFallbackReply(question: string, documents: AssistantDocument[], scope: AssistantScope) {
  if (isRestrictedQuestion(question)) {
    return scope === "admin"
      ? "Aku tidak membuka atau mengirim KTP, KK, token rumah, atau file bukti ke AI. Gunakan panel admin dan endpoint privat yang tersedia untuk pemeriksaan dokumen."
      : "Data tersebut bukan informasi publik. Silakan hubungi pengurus atau masuk melalui jalur admin yang sesuai.";
  }

  const relevant = selectRelevantDocuments(question, documents);
  if (!relevant.length) {
    return "Aku belum menemukan jawaban yang cocok dari informasi OPAL yang tersedia. Coba tanyakan iuran, Kas OPAL, aturan parkir, renovasi, sampah, stiker kendaraan, atau layanan surat.";
  }

  const answer = relevant.slice(0, 3).map((document) => `${document.title}: ${textWithoutMarkdown(document.text).slice(0, 600)}`).join("\n\n");
  return `Berdasarkan data OPAL:\n\n${answer}`;
}

