import { z } from "zod";

export const houseStatusValues = ["self", "relative", "tenant", "vacant_rent", "vacant_sale"] as const;
export const occupationValues = ["employee", "entrepreneur", "student"] as const;
export const documentRequestTypes = ["move", "domicile", "single"] as const;

const requiredText = (label: string, min = 2, max = 500) => z.string().trim().min(min, `${label} wajib diisi.`).max(max, `${label} terlalu panjang.`);
const whatsapp = z.string().trim().regex(/^(?:\+62|62|0)8[1-9][0-9]{6,12}$/, "Nomor WhatsApp tidak valid.");

export const residentSubmissionSchema = z.object({
  email: z.string().trim().email("Email tidak valid."),
  gang: z.coerce.number().int().refine((value) => [1, 2, 3, 5].includes(value), "Gang harus 1, 2, 3, atau 5."),
  houseNumber: requiredText("Nomor rumah", 1, 8).regex(/^[0-9A-Za-z/-]+$/, "Nomor rumah tidak valid."),
  houseStatus: z.enum(houseStatusValues),
  responsibleName: requiredText("Nama penanggung jawab", 2, 160),
  responsibleAddress: requiredText("Alamat penanggung jawab", 8, 500),
  whatsapp,
  headOfHouseholdName: requiredText("Nama kepala keluarga", 2, 160),
  headOfHouseholdOccupation: z.enum(occupationValues),
  occupantsCount: z.coerce.number().int().min(1, "Jumlah penghuni minimal 1.").max(30, "Jumlah penghuni maksimal 30."),
  environmentFeedback: z.string().trim().max(2000, "Feedback lingkungan terlalu panjang.").optional().default(""),
  managementFeedback: z.string().trim().max(2000, "Feedback pengurus terlalu panjang.").optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export type ResidentSubmissionInput = z.infer<typeof residentSubmissionSchema>;
export type ResidentSubmissionFormInput = z.input<typeof residentSubmissionSchema>;

const baseRequestSchema = z.object({
  contactName: requiredText("Nama pemohon", 2, 160),
  contactEmail: z.string().trim().email("Email tidak valid."),
  contactWhatsapp: whatsapp,
  gang: z.coerce.number().int().refine((value) => [1, 2, 3, 5].includes(value), "Gang harus 1, 2, 3, atau 5."),
  houseNumber: requiredText("Nomor rumah", 1, 8).regex(/^[0-9A-Za-z/-]+$/, "Nomor rumah tidak valid."),
  website: z.string().max(0).optional().default(""),
});

export const moveRequestSchema = baseRequestSchema.extend({
  fullName: requiredText("Nama lengkap", 2, 160),
  nik: z.string().regex(/^\d{16}$/, "NIK harus 16 digit."),
  kk: z.string().regex(/^\d{16}$/, "Nomor KK harus 16 digit."),
  gender: requiredText("Jenis kelamin", 2, 40),
  birthPlaceDate: requiredText("Tempat dan tanggal lahir", 4, 160),
  religion: requiredText("Agama", 2, 80),
  citizenship: requiredText("Kewarganegaraan", 2, 80),
  oldAddress: requiredText("Alamat lama", 5, 500),
  oldVillage: requiredText("Kelurahan lama", 2, 160),
  oldDistrict: requiredText("Kecamatan lama", 2, 160),
  oldRegency: requiredText("Kabupaten lama", 2, 160),
  oldProvince: requiredText("Provinsi lama", 2, 160),
  newAddress: requiredText("Alamat baru", 5, 500),
  newVillage: requiredText("Kelurahan baru", 2, 160),
  newDistrict: requiredText("Kecamatan baru", 2, 160),
  newRegency: requiredText("Kabupaten baru", 2, 160),
  newProvince: requiredText("Provinsi baru", 2, 160),
  reason: requiredText("Alasan pindah", 3, 500),
  followersCount: z.coerce.number().int().min(0).max(30),
});

export const domicileRequestSchema = baseRequestSchema.extend({
  fullName: requiredText("Nama", 2, 160),
  birthPlaceDate: requiredText("Tempat dan tanggal lahir", 4, 160),
  gender: requiredText("Jenis kelamin", 2, 40),
  occupation: requiredText("Pekerjaan", 2, 160),
  religion: requiredText("Agama", 2, 80),
  maritalStatus: requiredText("Status perkawinan", 2, 80),
  citizenship: requiredText("Kewarganegaraan", 2, 80),
  address: requiredText("Alamat", 5, 500),
});

export const singleRequestSchema = baseRequestSchema.extend({
  fullName: requiredText("Nama", 2, 160),
  nik: z.string().regex(/^\d{16}$/, "Nomor KTP harus 16 digit."),
  birthPlaceDate: requiredText("Tempat dan tanggal lahir", 4, 160),
  gender: requiredText("Jenis kelamin", 2, 40),
  religion: requiredText("Agama", 2, 80),
  occupation: requiredText("Pekerjaan", 2, 160),
  maritalStatus: requiredText("Status perkawinan", 2, 80),
  address: requiredText("Alamat", 5, 500),
});

export function requestSchemaFor(type: (typeof documentRequestTypes)[number]) {
  return type === "move" ? moveRequestSchema : type === "domicile" ? domicileRequestSchema : singleRequestSchema;
}

export type DocumentRequestInput = z.infer<typeof moveRequestSchema> | z.infer<typeof domicileRequestSchema> | z.infer<typeof singleRequestSchema>;

export function unitCode(gang: number, houseNumber: string) {
  return `OP ${gang} - ${houseNumber.trim().padStart(2, "0")}`;
}
