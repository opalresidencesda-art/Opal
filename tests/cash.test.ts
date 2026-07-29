import { describe, expect, it } from "vitest";
import { filterPublicCashCategories } from "../src/lib/cash";

const categories = [
  { category: "Iuran Warga", income: 100, expense: 0 },
  { category: "CCTV", income: 0, expense: 80 },
  { category: "Agustusan", income: 20, expense: 40 },
];

describe("filterPublicCashCategories", () => {
  it("finds categories by Indonesian text and direction without changing source order", () => {
    expect(filterPublicCashCategories(categories, "warga", "all").map((item) => item.category)).toEqual(["Iuran Warga"]);
    expect(filterPublicCashCategories(categories, "", "expense").map((item) => item.category)).toEqual(["CCTV", "Agustusan"]);
  });
});
