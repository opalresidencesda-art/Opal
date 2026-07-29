import { describe, expect, it } from "vitest";
import { getNextAnnouncementIndex, sortGuideSections } from "../src/lib/content";
import { sanitizeMarkdown } from "../src/lib/markdown";
import { quickAccessCategories } from "../src/lib/quick-access";

describe("quickAccessCategories", () => {
  it("keeps every resident service reachable from the four homepage categories", () => {
    expect(quickAccessCategories.map((category) => category.id)).toEqual(["surat", "panduan", "data", "keuangan"]);
    expect(quickAccessCategories.flatMap((category) => category.items.map((item) => item.href))).toEqual([
      "/surat/pindah-rumah",
      "/surat/domisili",
      "/surat/belum-menikah",
      "/panduan-harmonis",
      "/petugas",
      "/spesifikasi-rumah",
      "/denah",
      "/pendataan-warga",
      "/kas",
      "#iuran",
    ]);
  });
});

describe("getNextAnnouncementIndex", () => {
  it("moves forward, backward, and wraps around the announcement list", () => {
    expect(getNextAnnouncementIndex(0, 3)).toBe(1);
    expect(getNextAnnouncementIndex(2, 3)).toBe(0);
    expect(getNextAnnouncementIndex(0, 3, -1)).toBe(2);
    expect(getNextAnnouncementIndex(4, 0)).toBe(0);
  });
});

describe("sortGuideSections", () => {
  it("preserves the guide order selected by RT", () => {
    const ordered = sortGuideSections([
      { slug: "sampah", title: "Sampah", summary: "x", bodyMarkdown: "x", sortOrder: 5 },
      { slug: "iuran", title: "Iuran", summary: "x", bodyMarkdown: "x", sortOrder: 1 },
      { slug: "parkir", title: "Parkir", summary: "x", bodyMarkdown: "x", sortOrder: 2 },
    ]);
    expect(ordered.map((section) => section.slug)).toEqual(["iuran", "parkir", "sampah"]);
  });
});

describe("sanitizeMarkdown", () => {
  it("removes raw HTML and executable content before rendering", () => {
    expect(sanitizeMarkdown("# Aman\n<script>alert(1)</script><strong>tetap teks</strong>")).toBe("# Aman\ntetap teks");
  });
});
