import "server-only";

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { OfficialDocumentType } from "@/lib/document-number";

export type DocumentSettings = {
  signerName: string;
  signerTitle: string;
  rtNumber: string;
  rwNumber: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  city: string;
  numberFormat: string;
  enabled: boolean;
};

type IssuedLetter = {
  type: OfficialDocumentType;
  number: string;
  issuedAt: Date;
  settings: DocumentSettings;
  payload: Record<string, unknown>;
};

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingRight: 54, paddingBottom: 48, paddingLeft: 54, fontFamily: "Helvetica", fontSize: 10.5, color: "#111111", lineHeight: 1.42 },
  center: { textAlign: "center" },
  title: { marginTop: 8, fontSize: 12, fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  number: { marginTop: 3, fontSize: 10 },
  paragraph: { marginTop: 16, textAlign: "justify" },
  table: { marginTop: 14, gap: 4 },
  row: { flexDirection: "row" },
  label: { width: "35%" },
  colon: { width: "4%" },
  value: { width: "61%" },
  signature: { marginTop: 34, marginLeft: "56%", width: "44%", textAlign: "center" },
  signatureSpace: { height: 66 },
  bold: { fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 24, fontSize: 8.5, color: "#4b5563" },
});

const titles: Record<OfficialDocumentType, string> = {
  move: "SURAT KETERANGAN PINDAH RUMAH",
  domicile: "SURAT KETERANGAN DOMISILI",
  single: "SURAT KETERANGAN BELUM MENIKAH",
};

function value(payload: Record<string, unknown>, key: string) {
  const raw = payload[key];
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : "-";
}

function dateInIndonesian(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
}

function DetailRows({ rows }: { rows: Array<[string, string]> }) {
  return <View style={styles.table}>{rows.map(([label, content]) => <View key={label} style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.colon}>:</Text><Text style={styles.value}>{content}</Text></View>)}</View>;
}

function LetterBody({ type, payload }: Pick<IssuedLetter, "type" | "payload">) {
  if (type === "move") {
    return <>
      <Text style={styles.paragraph}>Yang bertanda tangan di bawah ini menerangkan bahwa warga tersebut di bawah ini mengajukan keterangan pindah rumah:</Text>
      <DetailRows rows={[
        ["Nama", value(payload, "fullName")], ["NIK", value(payload, "nik")], ["Nomor KK", value(payload, "kk")], ["Jenis kelamin", value(payload, "gender")], ["Tempat, tanggal lahir", value(payload, "birthPlaceDate")], ["Agama", value(payload, "religion")], ["Kewarganegaraan", value(payload, "citizenship")], ["Alamat lama", value(payload, "oldAddress")], ["Kelurahan / Kecamatan", `${value(payload, "oldVillage")} / ${value(payload, "oldDistrict")}`], ["Kabupaten / Provinsi", `${value(payload, "oldRegency")} / ${value(payload, "oldProvince")}`], ["Alamat tujuan", value(payload, "newAddress")], ["Wilayah tujuan", `${value(payload, "newVillage")}, ${value(payload, "newDistrict")}, ${value(payload, "newRegency")}, ${value(payload, "newProvince")}`], ["Alasan pindah", value(payload, "reason")], ["Jumlah pengikut", value(payload, "followersCount")],
      ]} />
      <Text style={styles.paragraph}>Surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</Text>
    </>;
  }
  if (type === "domicile") {
    return <>
      <DetailRows rows={[
        ["Nama", value(payload, "fullName")], ["Tempat/Tgl. Lahir", value(payload, "birthPlaceDate")], ["Jenis Kelamin", value(payload, "gender")], ["Pekerjaan", value(payload, "occupation")], ["Agama", value(payload, "religion")], ["Status Perkawinan", value(payload, "maritalStatus")], ["Kewarganegaraan", value(payload, "citizenship")], ["Alamat", value(payload, "address")],
      ]} />
      <Text style={styles.paragraph}>Orang tersebut diatas, adalah benar-benar warga kami dan berdomisili di wilayah tersebut. Demikian surat keterangan ini dibuat sebagai kelengkapan pengurusan.</Text>
      <Text style={styles.paragraph}>Demikian surat keterangan ini kami buat, untuk dapat dipergunakan sebagaimana mestinya.</Text>
    </>;
  }
  return <>
    <DetailRows rows={[
      ["Nama", value(payload, "fullName")], ["NIK", value(payload, "nik")], ["Tempat, tanggal lahir", value(payload, "birthPlaceDate")], ["Jenis kelamin", value(payload, "gender")], ["Agama", value(payload, "religion")], ["Pekerjaan", value(payload, "occupation")], ["Status perkawinan", value(payload, "maritalStatus")], ["Alamat", value(payload, "address")],
    ]} />
    <Text style={styles.paragraph}>Orang tersebut adalah benar berdomisili di alamat tersebut dan sampai dikeluarkannya surat keterangan ini yang bersangkutan belum menikah.</Text>
    <Text style={styles.paragraph}>Adapun Surat Keterangan ini kami buat, untuk dapat dipergunakan sebagaimana mestinya.</Text>
  </>;
}

export function OfficialLetterPdf({ type, number, issuedAt, settings, payload }: IssuedLetter) {
  const introRegion = `${settings.signerTitle} ${settings.rtNumber}, RW ${settings.rwNumber}, Kelurahan ${settings.kelurahan}, Kecamatan ${settings.kecamatan}, Kabupaten ${settings.kabupaten}, ${settings.provinsi}`;
  return <Document title={titles[type]} author="OPAL Residence" subject={number}>
    <Page size="A4" style={styles.page}>
      <Text style={[styles.center, styles.title]}>{titles[type]}</Text>
      <Text style={[styles.center, styles.number]}>Nomor: {number}</Text>
      <Text style={styles.paragraph}>Yang bertanda tangan di bawah ini {introRegion}, dengan ini menerangkan bahwa:</Text>
      <LetterBody type={type} payload={payload} />
      <View style={styles.signature}>
        <Text>{settings.city}, {dateInIndonesian(issuedAt)}</Text>
        <Text>{settings.signerTitle}</Text>
        <View style={styles.signatureSpace} />
        <Text style={styles.bold}>{settings.signerName}</Text>
        <Text>RT {settings.rtNumber} / RW {settings.rwNumber}</Text>
      </View>
      <Text style={styles.footer}>Tanda tangan dan stempel dibubuhkan manual oleh pengurus RT setelah dokumen dicetak.</Text>
    </Page>
  </Document>;
}

export async function renderOfficialDocument(letter: IssuedLetter) {
  return renderToBuffer(<OfficialLetterPdf {...letter} />);
}
