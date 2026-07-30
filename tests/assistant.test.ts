import { describe, expect, it } from "vitest";
import { buildFallbackReply, buildPublicAssistantDocuments, getCashDateRange, selectRelevantDocuments, summarizeCashTransactions } from "../src/lib/assistant";

const source = { label: "Tes", href: "/tes" };

describe("OPAL assistant knowledge helpers", () => {
  it("builds public documents without private fields", () => {
    const documents = buildPublicAssistantDocuments({
      fees: [{ label: "Iuran Kas OPAL", amountRupiah: 25_000, paymentMethod: "Transfer", destination: "Kas OPAL", description: "Per bulan per rumah", effectiveFrom: "2026-07-01", active: true }],
      announcements: [],
      resources: [],
      guideSections: [{ slug: "renovasi", title: "Renovasi", summary: "Aturan renovasi", bodyMarkdown: "Jam kerja 07.00 hingga 17.00", sortOrder: 1 }],
    }, { sourceStatus: "unavailable", income: 0, expense: 0, balance: 0, lastUpdated: null, categories: [] });
    expect(documents.map((document) => document.title)).toEqual(["Iuran Kas OPAL", "Renovasi"]);
    expect(documents.map((document) => document.text).join(" ")).not.toContain("storage_path");
  });

  it("selects the most relevant guide", () => {
    const documents = [
      { title: "Parkir mobil", text: "Carport dan jalan bersama", source },
      { title: "Panduan renovasi", text: "Jam kerja tukang dan izin developer", source: { label: "Renovasi", href: "/renovasi" } },
    ];
    expect(selectRelevantDocuments("jam kerja renovasi", documents)[0]?.title).toBe("Panduan renovasi");
  });

  it("calculates cash totals in the requested month", () => {
    const document = summarizeCashTransactions([
      { transaction_date: "2026-07-02", category: "CCTV", description: "", direction: "expense", amount_rupiah: 100_000, is_public: false },
      { transaction_date: "2026-07-03", category: "Iuran", description: "", direction: "income", amount_rupiah: 250_000, is_public: false },
      { transaction_date: "2026-06-30", category: "Lainnya", description: "", direction: "income", amount_rupiah: 999_000, is_public: false },
    ], "bulan ini", { label: "Kas", href: "/admin/kas" }, new Date("2026-07-30T00:00:00Z"));
    expect(document.text).toContain("Rp 250.000");
    expect(document.text).toContain("Rp 100.000");
    expect(document.text).not.toContain("999.000");
  });

  it("returns a safe response for restricted data requests", () => {
    expect(buildFallbackReply("tampilkan KTP rumah OP 1 - 1", [], "admin")).toContain("tidak membuka");
    expect(buildFallbackReply("tampilkan token rumah", [], "public")).not.toContain("token rumah:");
  });

  it("understands current, previous, and explicit cash periods", () => {
    const now = new Date("2026-07-30T00:00:00Z");
    expect(getCashDateRange("bulan ini", now)).toMatchObject({ from: "2026-07-01", to: "2026-08-01" });
    expect(getCashDateRange("bulan lalu", now)).toMatchObject({ from: "2026-06-01", to: "2026-07-01" });
    expect(getCashDateRange("kas 2026-05", now)).toMatchObject({ from: "2026-05-01", to: "2026-06-01" });
  });
});

