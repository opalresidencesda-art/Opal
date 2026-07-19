import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("layanan native dapat dibuka tanpa tautan Google", async ({ page }) => {
  await page.goto("/layanan");
  await expect(page.getByRole("heading", { name: "Bukan kumpulan tautan. Tempat mengurus kebutuhan lingkungan." })).toBeVisible();
  const residentService = page.locator('main a[href="/pendataan-warga"]');
  await expect(residentService).toHaveCount(1);
  await expect(residentService).toHaveAttribute("href", "/pendataan-warga");
  await expect(page.getByRole("link", { name: /Surat Keterangan Domisili/ })).toHaveAttribute("href", "/surat/domisili");
});

test("panduan memiliki anchor dan tidak overflow pada viewport aktif", async ({ page }) => {
  await page.goto("/panduan-harmonis#stiker-kendaraan");
  await expect(page.locator("#stiker-kendaraan")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("halaman publik tidak memiliki pelanggaran axe kritis", async ({ page }) => {
  await page.goto("/pendataan-warga");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
