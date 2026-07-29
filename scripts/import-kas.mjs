#!/usr/bin/env node
/*
 * One-shot, idempotent importer for the legacy Kas workbook.
 * It intentionally publishes nothing by itself: imported transactions are
 * private until an RT marks them public from /admin.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const file = process.env.OPAL_KAS_XLSX;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const importedBy = process.env.OPAL_IMPORTER_EMAIL;
const dryRun = process.argv.includes("--dry-run");
const publish = process.argv.includes("--publish");
const replace = process.argv.includes("--replace");

if (!file || !url || !key || !importedBy) {
  throw new Error("Set OPAL_KAS_XLSX, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan OPAL_IMPORTER_EMAIL terlebih dahulu.");
}

const sourceBytes = readFileSync(file);
const sourceSha = createHash("sha256").update(sourceBytes).digest("hex");
const sourceName = `kas-workbook:${file.split(/[\\/]/).pop()}`;
const workbook = XLSX.read(sourceBytes, { cellDates: true });
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function text(value) { return String(value ?? "").trim(); }
function keyOf(value) { return text(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, " ").trim(); }
function amount(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(Math.abs(value));
  const cleaned = text(value).replace(/rp\.?/gi, "").replace(/[^0-9,-]/g, "").replace(/,/g, ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(Math.abs(parsed)) : 0;
}
function date(value, fallbackYear) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const raw = text(value);
  if (keyOf(raw) === "cut off" && Number.isInteger(Number(fallbackYear))) return `${Number(fallbackYear)}-01-01`;
  const monthNames = {
    jan: 1, january: 1, januari: 1,
    feb: 2, february: 2, februari: 2,
    mar: 3, march: 3, maret: 3,
    apr: 4, april: 4,
    may: 5, mei: 5,
    jun: 6, june: 6, juni: 6,
    jul: 7, july: 7, juli: 7,
    aug: 8, august: 8, agustus: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, oktober: 10,
    nov: 11, november: 11,
    dec: 12, december: 12, desember: 12,
  };
  const textDate = raw.match(/^(\d{1,2})[-/ ]([A-Za-z]+)[-/ ](\d{2,4})$/);
  if (textDate) {
    const [, day, monthName, yearValue] = textDate;
    const month = monthNames[monthName.toLowerCase()];
    const year = Number(yearValue) < 100 ? 2000 + Number(yearValue) : Number(yearValue);
    if (month && year) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) return null;
  // Date-only text is parsed as UTC by Node; use local calendar parts so a
  // workbook entry such as 01-May-25 does not become 2025-04-30 in Jakarta.
  return /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw
    : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}
function monthPeriod(value) {
  const direct = date(value);
  if (direct) return direct.slice(0, 7) + "-01";
  const months = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
  const normalized = keyOf(value);
  const index = months.findIndex((month) => normalized.includes(month));
  const year = normalized.match(/20\d{2}/)?.[0];
  return index >= 0 && year ? `${year}-${String(index + 1).padStart(2, "0")}-01` : null;
}
function findHeader(rows, expected) {
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const headers = rows[i].map(keyOf);
    if (expected.every((needle) => headers.some((header) => header.includes(needle)))) return { row: i, headers };
  }
  return null;
}
function headerIndex(headers, alternatives) { return headers.findIndex((header) => alternatives.some((item) => header.includes(item))); }
function unitCode(gang, house) {
  const gangNumber = text(gang).match(/[1235]/)?.[0];
  const number = text(house).replace(/^no\.?\s*/i, "").trim();
  return gangNumber && /^[0-9a-z/-]{1,8}$/i.test(number) ? `OP ${gangNumber} - ${number.padStart(2, "0")}` : null;
}

function normalizeLedger() {
  const sheetName = workbook.SheetNames.find((name) => keyOf(name).includes("pembukuan"));
  if (!sheetName) return { items: [], sourceBalance: null, cutOffRows: 0 };
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true });
  const header = findHeader(rows, ["tanggal"]);
  if (!header) return { items: [], sourceBalance: null, cutOffRows: 0 };
  const dateIndex = headerIndex(header.headers, ["tanggal", "tgl"]);
  const periodIndex = headerIndex(header.headers, ["periode", "tahun", "year"]);
  const descriptionIndex = headerIndex(header.headers, ["keterangan", "uraian", "deskripsi"]);
  const categoryIndex = headerIndex(header.headers, ["kategori", "jenis", "klasifikasi"]);
  const incomeIndex = headerIndex(header.headers, ["pemasukan", "masuk", "debit"]);
  const expenseIndex = headerIndex(header.headers, ["pengeluaran", "keluar", "kredit"]);
  const balanceIndex = headerIndex(header.headers, ["sisa saldo", "saldo"]);
  const items = [];
  let sourceBalance = null;
  let cutOffRows = 0;
  for (const row of rows.slice(header.row + 1)) {
    const transactionDate = date(row[dateIndex], periodIndex >= 0 ? row[periodIndex] : undefined);
    const income = incomeIndex >= 0 ? amount(row[incomeIndex]) : 0;
    const expense = expenseIndex >= 0 ? amount(row[expenseIndex]) : 0;
    if (balanceIndex >= 0 && typeof row[balanceIndex] === "number" && Number.isFinite(row[balanceIndex])) sourceBalance = Math.round(row[balanceIndex]);
    if (keyOf(row[dateIndex]) === "cut off") cutOffRows += 1;
    if (!transactionDate || (!income && !expense)) continue;
    if (income) items.push({ transaction_date: transactionDate, category: text(row[categoryIndex]) || "Lainnya", description: text(row[descriptionIndex]), direction: "income", amount_rupiah: income, is_public: false });
    if (expense) items.push({ transaction_date: transactionDate, category: text(row[categoryIndex]) || "Lainnya", description: text(row[descriptionIndex]), direction: "expense", amount_rupiah: expense, is_public: false });
  }
  return { items, sourceBalance, cutOffRows };
}

function normalizeContributions() {
  const sheetName = workbook.SheetNames.find((name) => keyOf(name).includes("iuran warga"));
  if (!sheetName) return [];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null, raw: true });
  const header = findHeader(rows, ["gang"]);
  if (!header) return [];
  const gangIndex = headerIndex(header.headers, ["gang", "blok"]);
  const houseIndex = headerIndex(header.headers, ["nomor rumah", "no rumah", "rumah"]);
  if (gangIndex < 0 || houseIndex < 0) return [];
  const periods = header.headers.map((value, index) => ({ index, period: monthPeriod(rows[header.row][index]) })).filter((item) => item.period);
  const items = [];
  for (const row of rows.slice(header.row + 1)) {
    const code = unitCode(row[gangIndex], row[houseIndex]);
    if (!code) continue;
    for (const { index, period } of periods) {
      const paid = amount(row[index]);
      if (!paid) continue;
      items.push({ unit_code: code, category: "Iuran Warga", period, amount_rupiah: paid, paid_at: period, status: "paid" });
    }
  }
  return items;
}

const ledger = normalizeLedger();
const transactions = ledger.items;
const contributions = normalizeContributions();
const incomeTotal = transactions.filter((item) => item.direction === "income").reduce((sum, item) => sum + item.amount_rupiah, 0);
const expenseTotal = transactions.filter((item) => item.direction === "expense").reduce((sum, item) => sum + item.amount_rupiah, 0);
const ledgerBalance = incomeTotal - expenseTotal;
const total = incomeTotal + expenseTotal + contributions.reduce((sum, item) => sum + item.amount_rupiah, 0);
console.table([{
  sheets: workbook.SheetNames.length,
  transactions: transactions.length,
  contributions: contributions.length,
  incomeRupiah: incomeTotal,
  expenseRupiah: expenseTotal,
  balanceRupiah: ledgerBalance,
  workbookBalanceRupiah: ledger.sourceBalance,
  cutOffRows: ledger.cutOffRows,
  publish,
  sourceSha: sourceSha.slice(0, 12),
}]);
if (dryRun) process.exit(0);

const { data: prior } = await supabase.from("source_imports").select("id").eq("source_name", sourceName).eq("source_sha256", sourceSha).maybeSingle();
if (prior) {
  const { count: priorCashCount, error: priorCashError } = await supabase
    .from("cash_transactions")
    .select("id", { count: "exact", head: true })
    .eq("imported_from", prior.id);
  if (priorCashError) throw new Error(`Tidak dapat memeriksa impor sebelumnya: ${priorCashError.message}`);
  if (replace || (priorCashCount ?? 0) !== transactions.length) {
    console.warn(replace
      ? `Memperbarui batch workbook yang sama (${priorCashCount ?? 0} transaksi lama); membersihkan batch terarah.`
      : `Impor sebelumnya tidak lengkap (${priorCashCount ?? 0}/${transactions.length}); membersihkan batch parsial yang dibuat skrip ini.`);
    const { error: contributionDeleteError } = await supabase.from("property_contributions").delete().eq("imported_from", prior.id);
    if (contributionDeleteError) throw new Error(`Batch kontribusi parsial tidak dapat dibersihkan: ${contributionDeleteError.message}`);
    const { error: cashDeleteError } = await supabase.from("cash_transactions").delete().eq("imported_from", prior.id);
    if (cashDeleteError) throw new Error(`Batch transaksi parsial tidak dapat dibersihkan: ${cashDeleteError.message}`);
    const { error: sourceDeleteError } = await supabase.from("source_imports").delete().eq("id", prior.id);
    if (sourceDeleteError) throw new Error(`Catatan impor parsial tidak dapat dibersihkan: ${sourceDeleteError.message}`);
  } else {
    if (publish) {
      const { error } = await supabase.from("cash_transactions").update({ is_public: true }).eq("imported_from", prior.id);
      if (error) throw new Error(`Data sudah ada, tetapi gagal dipublikasikan: ${error.message}`);
      console.log(`Sumber yang sama sudah diimpor. ${transactions.length} transaksi sekarang ditandai publik.`);
      process.exit(0);
    }
    console.log("Sumber yang sama sudah diimpor; tidak ada perubahan.");
    process.exit(0);
  }
}
const { data: importRow, error: importError } = await supabase.from("source_imports").insert({ source_name: sourceName, source_sha256: sourceSha, row_count: transactions.length + contributions.length, amount_total_rupiah: total, imported_by: importedBy, notes: publish ? "Legacy workbook import; rows published by explicit --publish flag." : "Legacy workbook import; rows remain private until reconciled." }).select("id").single();
if (importError || !importRow) throw new Error(`Tidak dapat membuat catatan impor: ${importError?.message ?? "unknown"}`);
for (let index = 0; index < transactions.length; index += 250) {
  const chunk = transactions.slice(index, index + 250).map((transaction) => ({ ...transaction, imported_from: importRow.id, source_reference: sourceName, is_public: publish }));
  const { error } = await supabase.from("cash_transactions").insert(chunk);
  if (error) throw new Error(`Gagal mengimpor transaksi batch ${index + 1}-${index + chunk.length}: ${error.message}`);
}
for (const contribution of contributions) {
  const { data: property, error: propertyError } = await supabase.from("properties").select("id").eq("unit_code", contribution.unit_code).maybeSingle();
  if (propertyError) throw new Error(`Gagal mencari ${contribution.unit_code}: ${propertyError.message}`);
  if (!property) { console.warn(`Lewati kontribusi: ${contribution.unit_code} belum ada di properties.`); continue; }
  const { error } = await supabase.from("property_contributions").upsert({ ...contribution, property_id: property.id, imported_from: importRow.id, source_reference: sourceName }, { onConflict: "property_id,category,period,amount_rupiah,source_reference" });
  if (error) throw new Error(`Gagal mengimpor kontribusi: ${error.message}`);
}
console.log(`Impor selesai. ${transactions.length} transaksi dan ${contributions.length} kontribusi menunggu rekonsiliasi RT.`);
