import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("layanan native dapat dibuka tanpa tautan Google", async ({ page }) => {
  await page.goto("/layanan");
  await expect(page).toHaveURL(/\/#akses-cepat$/);
  await expect(page.getByRole("heading", { name: "Pilih kebutuhan Anda." })).toBeVisible();
  await page.getByRole("button", { name: "Data" }).click();
  await expect(page.getByRole("link", { name: "Pendataan warga", exact: true })).toHaveAttribute("href", "/pendataan-warga");
});

test("semua halaman publik utama dapat dibuka tanpa overflow horizontal", async ({ page }) => {
  test.setTimeout(120_000);
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
    const response = await page.goto(route, { timeout: 60_000, waitUntil: "domcontentloaded" });
    expect(response?.ok(), `${route} gagal dimuat`).toBe(true);
    if (route === "/layanan") {
      await expect(page.getByRole("heading", { name: "Pilih kebutuhan Anda." })).toBeVisible();
    } else {
      await expect(page.locator("h1")).toBeVisible();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${route} mengalami overflow horizontal`,
    ).toBe(true);
  }
});

test("pencarian Beranda membawa warga ke informasi portal yang sesuai", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.locator("[data-home-portal-search-ready='true']")).toBeVisible();
  const search = page.getByRole("combobox", { name: "Cari informasi warga" });
  await expect(page.getByRole("button", { name: "Cari", exact: true })).toBeVisible();

  await search.fill("domisili");
  await expect(page.getByRole("option", { name: /Surat Keterangan Domisili/ })).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/surat\/domisili$/);

  await page.goto("/");
  await search.fill("surat");
  const initialActiveResult = await search.getAttribute("aria-activedescendant");
  await search.press("ArrowDown");
  await expect.poll(() => search.getAttribute("aria-activedescendant")).not.toBe(initialActiveResult);
  await expect(page.locator('[role="option"][aria-selected="true"]')).toHaveAttribute("href", /\/surat\//);
  await search.press("Escape");

  await page.goto("/");
  await search.fill("parkir");
  await expect(page.getByRole("option", { name: /Panduan Harmonis/ })).toHaveAttribute("href", "/panduan-harmonis");
  await search.press("Escape");
  await expect(page.getByRole("listbox", { name: "Hasil pencarian" })).toHaveCount(0);

  await search.fill("iuran");
  await expect(page.getByRole("option", { name: /Iuran aktif/ })).toHaveAttribute("href", "#iuran");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/#iuran$/);

  await page.goto("/");
  await search.fill("petugas");
  await expect(page.getByRole("option", { name: /Petugas Pos & Taman/ })).toHaveAttribute("href", "/petugas");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/petugas$/);
});

test("Beranda mempertahankan pengumuman dan tidak overflow di kedua tema", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-home-portal-search-ready='true']")).toBeVisible();
  const pauseButton = page.getByRole("button", { name: "Jeda pengumuman otomatis" });
  if (await pauseButton.count()) {
    await pauseButton.click();
    await expect(page.getByRole("button", { name: "Putar pengumuman otomatis" })).toBeVisible();
  } else {
    await expect(page.getByLabel("Pengumuman warga")).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Asisten OPAL dapat dibuka tanpa memulai percakapan palsu", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Buka Asisten OPAL" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Asisten OPAL" })).toBeVisible();
  await expect(page.getByText("Asisten AI sedang disiapkan.")).toBeVisible();
  await expect(page.getByLabel("Tulis pertanyaan untuk Asisten OPAL")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sembunyikan Asisten OPAL" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Asisten OPAL" })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("dialog", { name: "Asisten OPAL" }).getByRole("button", { name: "Tutup Asisten OPAL" }).click();
  await expect(page.getByRole("dialog", { name: "Asisten OPAL" })).toHaveCount(0);
});

test("panduan memiliki anchor dan tidak overflow pada viewport aktif", async ({ page }) => {
  await page.goto("/panduan-harmonis#stiker-kendaraan");
  await expect(page.locator("#stiker-kendaraan")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("panduan memakai peta topik visual dan rincian yang dapat dibuka", async ({ page }) => {
  await page.goto("/panduan-harmonis");
  const topicIndex = page.locator('[data-guide-topic-index="true"]');
  await expect(topicIndex).toBeVisible();
  await expect(topicIndex.getByRole("link")).toHaveCount(5);

  await topicIndex.locator('a[href="#renovasi"]').click();
  await expect(page).toHaveURL(/\/panduan-harmonis#renovasi$/);

  const renovation = page.locator("#renovasi");
  await expect(renovation).toBeVisible();
  const details = renovation.locator("details");
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
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
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).not.toBe(initialTheme);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
