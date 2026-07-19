import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;

export async function sendSafeReceipt({ to, unitCode, reference, service }: { to: string; unitCode: string; reference: string; service: string }) {
  if (!apiKey || !from) return { sent: false as const };

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: `Kami menerima ${service} Anda`,
    text: [
      `Terima kasih. Pengajuan untuk ${unitCode} telah diterima oleh Portal Warga OPAL.`,
      `Nomor referensi: ${reference}.`,
      "Email ini tidak memuat data identitas atau berkas Anda. Pengurus RT akan meninjau pengajuan dan menghubungi Anda bila diperlukan.",
    ].join("\n\n"),
  });
  return { sent: true as const };
}
