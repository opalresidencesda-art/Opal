import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("layanan native dapat dibuka tanpa tautan Google", async ({ page }) => {
  await page.goto("/layanan");
  await expect(page.getByRole("heading", { name: "Pilih layanan warga yang Anda perlukan." })).toBeVisible();
  const residentService = page.locator('main a[href="/pendataan-warga"]');
  await expect(residentService).toHaveCount(2);
  await expect(page.getByRole("link", { name: /Surat Keterangan Domisili/ })).toHaveAttribute("href", "/surat/domisili");
});

test("semua halaman publik utama dapat dibuka tanpa overflow horizontal", async ({ page }) => {
  const routes = [
    "/",
    "/layanan",
    "/kas",
    "/panduan-harmonis",
    "/pendataan-warga",
    "/petugas",
    "/spesifikasi-rumah",
    "/denah",
    "/surat/pindah-rumah",
    "/surat/domisili",
    "/surat/belum-menikah",
    "/admin/login",
  ];

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), `${route} gagal dimuat`).toBe(true);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${route} mengalami overflow horizontal`,
    ).toBe(true);
  }
});

test("panduan memiliki anchor dan tidak overflow pada viewport aktif", async ({ page }) => {
  await page.goto("/panduan-harmonis#stiker-kendaraan");
  await expect(page.locator("#stiker-kendaraan")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("anchor panduan memindahkan konteks keyboard ke bagian tujuan", async ({ page }) => {
  await page.goto("/panduan-harmonis#stiker-kendaraan");
  await expect(page.locator("#stiker-kendaraan")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest("article")?.id ?? document.activeElement?.id ?? "")).toBe("stiker-kendaraan");
});

test("tautan lewati memindahkan fokus ke isi utama", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Lewati ke isi utama" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("CTA admin di beranda mempertahankan kontras tinggi", async ({ page }) => {
  await page.goto("/");
  const adminCta = page.getByRole("link", { name: "Masuk admin RT" });
  await expect(adminCta).toBeVisible();
  await expect(adminCta).toHaveClass(/bg-action/);
  await expect(adminCta).toHaveClass(/text-on-action/);
});

test("login admin memakai email dan kata sandi tanpa magic link", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel("Email admin")).toBeVisible();
  await expect(page.getByLabel("Kata sandi")).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk ke admin" })).toBeVisible();
  await expect(page.getByText("Kirim tautan masuk")).toHaveCount(0);
});
test("halaman publik tidak memiliki pelanggaran axe kritis", async ({ page }) => {
  await page.goto("/pendataan-warga");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});

test("tema gelap halaman formulir tidak memiliki pelanggaran axe kritis", async ({ page }) => {
  await page.goto("/pendataan-warga");
  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
