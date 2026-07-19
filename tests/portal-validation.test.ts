import { describe, expect, it } from "vitest";
import { formatDocumentNumber } from "../src/lib/document-number";
import { residentSubmissionSchema, unitCode } from "../src/lib/validation";

describe("resident submission validation", () => {
  it("accepts the complete native form and coerces its numeric fields", () => {
    const result = residentSubmissionSchema.parse({
      email: "warga@example.com", gang: "2", houseNumber: "62", houseStatus: "self",
      responsibleName: "Naufal", responsibleAddress: "OPAL Residence Gang 2 No. 62", whatsapp: "081234567890",
      headOfHouseholdName: "Naufal", headOfHouseholdOccupation: "employee", occupantsCount: "3",
      environmentFeedback: "", managementFeedback: "", website: "",
    });
    expect(result.gang).toBe(2);
    expect(result.occupantsCount).toBe(3);
    expect(unitCode(result.gang, result.houseNumber)).toBe("OP 2 - 62");
  });

  it("rejects incomplete NIK-like WhatsApp values and invalid gang", () => {
    expect(() => residentSubmissionSchema.parse({ email: "a@b.com", gang: "4", houseNumber: "1", houseStatus: "self", responsibleName: "A", responsibleAddress: "alamat cukup panjang", whatsapp: "123", headOfHouseholdName: "A", headOfHouseholdOccupation: "employee", occupantsCount: 1 })).toThrow();
  });
});

describe("document serial", () => {
  it("uses only the configured placeholders", () => {
    expect(formatDocumentNumber("{number}/{code}/RT-{year}", "domicile", 7, 2026)).toBe("007/SKD/RT-2026");
  });
});
