import { describe, expect, it } from "vitest";
import { defaultPortalData } from "../src/lib/content";
import { buildHomeSearchIndex, normaliseHomeSearchText, searchHomeContent } from "../src/lib/home-search";

describe("home search", () => {
  const index = buildHomeSearchIndex(defaultPortalData);

  it("normalises Indonesian search terms before matching", () => {
    expect(normaliseHomeSearchText("  Tipe 6 × 12  ")).toBe("tipe 6 12");
  });

  it("puts a title match before a description-only match", () => {
    const results = searchHomeContent(index, "domisili");

    expect(results[0]).toMatchObject({
      title: "Surat Keterangan Domisili",
      href: "/surat/domisili",
    });
  });

  it("links guide and fee searches to their current public anchors", () => {
    expect(searchHomeContent(index, "parkir")[0]).toMatchObject({ href: "/panduan-harmonis#parkir", kind: "Panduan" });
    expect(searchHomeContent(index, "iuran")[0]).toMatchObject({ href: "#iuran" });
  });

  it("includes published announcements and keeps duplicate services out of the index", () => {
    expect(searchHomeContent(index, "format website")[0]).toMatchObject({
      kind: "Pengumuman",
      href: "#pengumuman",
    });
    expect(index.filter((item) => item.title === "Kas OPAL")).toHaveLength(1);
  });

  it("returns no matches for an unrelated query", () => {
    expect(searchHomeContent(index, "pajak kendaraan")).toEqual([]);
  });
});
