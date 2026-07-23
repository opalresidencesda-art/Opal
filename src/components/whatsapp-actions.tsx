"use client";

import { Check, Copy, WhatsappLogo } from "@phosphor-icons/react";
import { useState } from "react";

export function WhatsAppActions({ phone, message }: { phone: string; message: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <div className="flex flex-wrap gap-2"><button type="button" onClick={copy} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-ink hover:border-brand hover:text-brand">{copied ? <Check size={15} weight="bold" /> : <Copy size={15} weight="bold" />}{copied ? "Tersalin" : "Salin pesan"}</button><a href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "62")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-on-brand hover:bg-brand-deep"><WhatsappLogo size={16} weight="fill" /> Buka WhatsApp</a></div>;
}
