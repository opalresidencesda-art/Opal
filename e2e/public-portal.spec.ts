import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("layanan native dapat dibuka tanpa tautan Google", async ({ page }) => {
  await page.goto("/layanan");
  await expect(page).toHaveURL(/\/#akses-cepat$/);
  await expect(page.getByLabel("Pintasan layanan warga")).toBeVisible();
  await expect(page.locator('[data-quick-access-panel]:visible a[href="/surat/domisili"]')).toBeVisible();
});

test("pintasan hero memilih layanan warga yang sesuai", async ({ page }) => {
  test.setTimeout(60_000);
  const expectedPanels = [
    ["Surat Menyurat", "surat", "/surat/domisili", "Surat Keterangan Domisili"],
    ["Panduan Harmonis Opal", "panduan", "/panduan-harmonis", "Panduan Harmonis"],
    ["Isi Data Warga", "data", "/pendataan-warga", "Pendataan warga"],
    ["Informasi Kas Opal", "keuangan", "/kas", "Kas OPAL"],
  ] as const;

  await page.goto("/");
  await expect(page.getByText("RT 3 RW 15. Jl. Delima Selatan, Kel. Tambakrejo, Kec. Waru, Kab. Sidoarjo, Jawa Timur 61256")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selamat Datang Warga Opal!" })).toBeVisible();
  await expect(page.getByText("Ketik apa yang anda cari di sini.")).toBeVisible();

  const heroShortcuts = page.getByLabel("Pintasan layanan warga");
  const panel = page.locator('[data-quick-access-panel]:visible');

  for (const [label, id, expectedHref, expectedTitle] of expectedPanels) {
    const navigationCount = await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );

    await heroShortcuts.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`\\/?akses=${id}#akses-cepat$`));
    await expect
      .poll(() =>
        page.evaluate(() => performance.getEntriesByType("navigation").length),
      )
      .toBe(navigationCount);
    await expect(panel.getByRole("heading", { name: label, exact: true })).toBeVisible();
    await expect(heroShortcuts.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "true");
    const selectedService = panel.locator(`a[href="${expectedHref}"]`);
    await expect(selectedService).toBeVisible();
    await expect(selectedService).toContainText(expectedTitle);
  }

  await expect(page.getByText("Pilih kebutuhan Anda.")).toHaveCount(0);
  await expect(page.getByText("Tekan salah satu kategori, lalu pilih layanan atau informasi yang ingin dibuka.")).toHaveCount(0);
  await expect(page.getByText("Pilih kategori")).toHaveCount(0);
});

test("menu mobile membuka organic overlay dan dapat ditutup dengan Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const openButton = page.getByRole("button", { name: "Buka menu navigasi" });
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
  await openButton.click();

  const mobileMenu = page.getByRole("navigation", { name: "Navigasi mobile" });
  await expect(mobileMenu).toBeVisible();
  const closeButton = page.getByRole("button", { name: "Tutup menu navigasi" });
  await expect(closeButton).toBeVisible();
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(mobileMenu.getByRole("link", { name: "Beranda", exact: true })).toBeVisible();
  await expect(mobileMenu.getByRole("link", { name: "Panduan harmonis", exact: true })).toBeVisible();
  await expect(mobileMenu.getByRole("link", { name: "Kas OPAL", exact: true })).toBeVisible();
  await expect(mobileMenu.getByRole("link", { name: /Admin RT|Admin aktif/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(mobileMenu).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Buka menu navigasi" })).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
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
      await expect(page.getByRole("heading", { name: "Akses cepat warga" })).toBeVisible();
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

test("Beranda menampilkan feed pengumuman yang stabil dan tidak overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-home-portal-search-ready='true']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "81 TAHUN KEMERDEKAAN RI" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Poster acara Merdeka Bersatu Gemilang di Delima, Agustus 2026" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pengumuman warga", level: 2 })).toBeVisible();
  await expect(page.getByRole("button", { name: /pengumuman otomatis/i })).toHaveCount(0);
  await expect(page.locator('[aria-roledescription="carousel"]')).toHaveCount(0);
  const readAnnouncement = page.getByRole("button", { name: /Baca pengumuman/ }).first();
  await expect(readAnnouncement).toBeVisible();
  await readAnnouncement.click();
  await expect(page.getByRole("dialog", { name: "81 TAHUN KEMERDEKAAN RI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tutup pengumuman" })).toBeVisible();
  await page.getByRole("button", { name: "Tutup pengumuman" }).click();
  await expect(page.getByRole("dialog", { name: "81 TAHUN KEMERDEKAAN RI" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ikuti Instagram Delima Residence" })).toBeVisible();
  await page.getByRole("button", { name: "Baca detail" }).click();
  const instagramDialog = page.getByRole("dialog", { name: "Ikuti Instagram Delima Residence" });
  await expect(instagramDialog).toBeVisible();
  await expect(instagramDialog.getByRole("img", { name: "Profil Instagram resmi Delima Residence dengan unggahan kegiatan warga." })).toBeVisible();
  await expect(instagramDialog.getByRole("link", { name: "https://www.instagram.com/delimaresidencesda/" })).toHaveAttribute("href", "https://www.instagram.com/delimaresidencesda/");
  await instagramDialog.getByRole("button", { name: "Tutup pengumuman" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("Beranda tetap rapi pada viewport ponsel sempit", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?akses=surat#akses-cepat");
    await expect(page.getByRole("heading", { name: "Selamat Datang Warga Opal!" })).toBeVisible();
    await expect(page.getByLabel("Pintasan layanan warga").getByRole("link", { name: "Surat Menyurat", exact: true })).toBeVisible();
    await expect(page.locator('[data-quick-access-panel]:visible a[href="/surat/pindah-rumah"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("Pintasan hero membuka layanan tepat di bawah kategori aktif", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Panduan Harmonis Opal", exact: true }).click();
  await expect(page).toHaveURL(/\?akses=panduan#akses-cepat$/);
  const panel = page.locator('[data-quick-access-panel]:visible');
  await expect(panel.getByRole("heading", { name: "Panduan Harmonis Opal" })).toBeVisible();
  await expect(panel.getByRole("link", { name: /Panduan Harmonis/ })).toBeVisible();
});

test("placeholder pencarian Beranda tetap terbaca di kontrol terang pada mobile dan kedua tema", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const contrastOfSearchPlaceholder = () => page.locator("#home-portal-search").evaluate((input) => {
    const parseColor = (value: string) => value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
    const luminance = (value: string) => {
      const [red, green, blue] = parseColor(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
    };
    const placeholder = getComputedStyle(input, "::placeholder").color;
    const background = getComputedStyle(input.parentElement!).backgroundColor;
    const foregroundLuminance = luminance(placeholder);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  });

  await expect.poll(contrastOfSearchPlaceholder).toBeGreaterThanOrEqual(4.5);
  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  await expect.poll(contrastOfSearchPlaceholder).toBeGreaterThanOrEqual(4.5);
});

test("Asisten OPAL dapat dibuka dengan input aktif tanpa percakapan palsu", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Buka Asisten OPAL" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const assistant = page.getByRole("dialog", { name: "Asisten OPAL" });
  await expect(assistant).toBeVisible();
  const assistantLayout = await assistant.evaluate((element) => {
    const panel = element.getBoundingClientRect();
    const header = document.querySelector("header")?.getBoundingClientRect();
    return { panelTop: panel.top, headerBottom: header?.bottom ?? 0, zIndex: getComputedStyle(element).zIndex };
  });
  expect(assistantLayout.panelTop).toBeGreaterThanOrEqual(assistantLayout.headerBottom);
  expect(assistantLayout.zIndex).toBe("99");
  await expect(page.getByText("Tanya informasi OPAL.")).toBeVisible();
  await expect(page.getByLabel("Tulis pertanyaan untuk Asisten OPAL")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Berapa iuran bulan ini?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sembunyikan Asisten OPAL" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Asisten OPAL" })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("dialog", { name: "Asisten OPAL" }).getByRole("button", { name: "Tutup Asisten OPAL" }).click();
  await expect(page.getByRole("dialog", { name: "Asisten OPAL" })).toHaveCount(0);
});

test("tautan panduan lama tetap membuka bagian yang tepat", async ({ page }) => {
  await page.goto("/panduan-harmonis#stiker-kendaraan");
  await expect(page).toHaveURL(/\/panduan-harmonis#stiker-kendaraan$/);
  await expect(page.getByRole("heading", { name: "Stiker kendaraan" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("panduan menampilkan semua topik terbuka dengan daftar isi", async ({ page }) => {
  await page.goto("/panduan-harmonis");
  await expect(page.getByRole("heading", { name: "Panduan Harmonis", exact: true })).toBeVisible();
  await expect(page.getByText("Cari aturan warga berdasarkan topik.")).toHaveCount(0);
  await expect(page.locator('[data-guide-topic-index="true"]')).toHaveCount(0);
  const desktopContents = page.locator('[data-guide-desktop-toc="true"]');
  const guideSectionCount = await page.locator('[data-guide-section="true"]').count();
  await expect(desktopContents.locator("a")).toHaveCount(guideSectionCount);
  await expect(desktopContents.locator('a[aria-current="location"]')).toHaveClass(/bg-brand-soft/);
  await expect(page.getByRole("heading", { name: "Iuran warga", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Panduan renovasi", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Iuran Pondok Tjandra", exact: true })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Iuran Kas OPAL", exact: true })).toHaveCount(1);
  await expect(page.locator('[data-guide-fee-card="true"]')).toHaveCount(2);
  await expect(page.locator('#stiker-kendaraan a[href="https://www.youtube.com/watch?v=qtyrlcLybZg"]')).toBeVisible();
  await expect(page.locator('#stiker-kendaraan a[href="https://www.youtube.com/watch?v=9blRp958AXs"]')).toBeVisible();
  await expect(page.locator('#stiker-kendaraan iframe')).toHaveCount(0);
  await expect(page.getByText("Arsip QR panduan lama")).toHaveCount(0);
  await expect(page.locator("#parkir > div h2")).toHaveText("Parkir mobil");
  await expect(page.locator("#parkir .guide-prose h3").first()).toHaveText("Mobil pertama");

  await page.goto("/panduan-harmonis#renovasi");
  await expect(page).toHaveURL(/\/panduan-harmonis#renovasi$/);

  await expect(page.getByRole("heading", { name: "Panduan renovasi" })).toBeVisible();
  await expect(page.locator("details")).toHaveCount(0);
  await expect(page.getByText("Baca aturan lengkap")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("rute pembaca panduan lama dialihkan ke bagian halaman tunggal", async ({ page }) => {
  await page.goto("/panduan-harmonis/parkir");
  await expect(page).toHaveURL(/\/panduan-harmonis#parkir$/);
  await expect(page.getByRole("heading", { name: "Parkir mobil" })).toBeVisible();
});

test("wheel Panduan menandai dan membuka bagian aktif di ponsel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/panduan-harmonis");
  const chapterWheel = page.getByRole("navigation", { name: "Navigasi bagian panduan" });
  await expect(chapterWheel).toBeVisible();
  await expect(chapterWheel.getByRole("link")).toHaveCount(await page.locator('[data-guide-section="true"]').count());
  await expect(chapterWheel.getByRole("link", { name: "01 Iuran warga" })).toHaveAttribute("aria-current", "location");
  await chapterWheel.getByRole("link", { name: "04 Panduan renovasi" }).click();
  await expect(page).toHaveURL(/\/panduan-harmonis#renovasi$/);
  await expect(page.locator('[data-guide-topic-cue="true"]')).toHaveText("Panduan renovasi");
  await page.locator("#renovasi").scrollIntoViewIfNeeded();
  await expect(chapterWheel.getByRole("link", { name: "04 Panduan renovasi" })).toHaveAttribute("aria-current", "location");
  await expect(page.locator('[data-guide-topic-cue="true"]')).toHaveCount(0, { timeout: 2_000 });
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
  expect(initialTheme).toBe("light");
  await page.getByRole("button", { name: "Ganti tema warna" }).click();
  await expect.poll(() => page.locator("html").getAttribute("data-theme")).not.toBe(initialTheme);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
