export type OfficialDocumentType = "move" | "domicile" | "single";

const codes: Record<OfficialDocumentType, string> = { move: "SKPR", domicile: "SKD", single: "SKDU" };

export function formatDocumentNumber(format: string, type: OfficialDocumentType, serial: number, year: number) {
  return format
    .replaceAll("{code}", codes[type])
    .replaceAll("{number}", String(serial).padStart(3, "0"))
    .replaceAll("{year}", String(year));
}
