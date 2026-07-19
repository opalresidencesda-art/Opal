import { describe, expect, it } from "vitest";
import { sortGuideSections } from "../src/lib/content";
import { sanitizeMarkdown } from "../src/lib/markdown";

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
