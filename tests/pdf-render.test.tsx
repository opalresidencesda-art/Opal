import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("official letter PDF", () => {
  it("renders a printable A4 document with the current issuer configuration", async () => {
    const { renderOfficialDocument } = await import("../src/lib/documents");
    const pdf = await renderOfficialDocument({
      type: "domicile",
      number: "007/SKD/RT-2026",
      issuedAt: new Date("2026-07-19T03:00:00.000Z"),
      settings: { signerName: "Nama Ketua RT", signerTitle: "Ketua RT", rtNumber: "08", rwNumber: "06", kelurahan: "Tambakrejo", kecamatan: "Waru", kabupaten: "Sidoarjo", provinsi: "Jawa Timur", city: "Sidoarjo", numberFormat: "{number}/{code}/RT-{year}", enabled: true },
      payload: { fullName: "Contoh Warga", birthPlaceDate: "Sidoarjo, 1 Januari 1990", gender: "Laki-laki", occupation: "Pegawai", religion: "Islam", maritalStatus: "Belum menikah", citizenship: "Indonesia", address: "OPAL Residence" },
    });
    const artifact = resolve(".tmp", "verified-domicile-letter.pdf");
    mkdirSync(dirname(artifact), { recursive: true });
    writeFileSync(artifact, pdf);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
