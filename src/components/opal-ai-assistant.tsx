"use client";

import { ArrowUp, CheckCircle, CircleNotch, LinkSimple, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type Scope = "public" | "admin";
type Source = { label: string; href: string };
type ChatMessage = { id: number; role: "user" | "assistant"; content: string; scope?: Scope; degraded?: boolean; sources?: Source[] };
const MAX_USER_MESSAGE_LENGTH = 2_000;
const MAX_ASSISTANT_HISTORY_LENGTH = 4_000;
const publicPrompts = ["Berapa iuran bulan ini?", "Bagaimana aturan renovasi?", "Cara mengajukan surat domisili?"];
const adminPrompts = ["Berapa total pengeluaran Kas bulan ini?", "Cari data rumah OP 1 - 1", "Ringkas transaksi Kas tahun ini."];

export function OpalAIAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [scope, setScope] = useState<Scope>("public");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const id = useRef(1);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    window.addEventListener("keydown", escape);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", escape); };
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }, [messages, pending, reduceMotion]);

  if (pathname.startsWith("/rumah/") || pathname === "/admin/login") return null;

  const send = async (value: string) => {
    const content = value.trim();
    if (!content || pending) return;
    const user: ChatMessage = { id: id.current++, role: "user", content };
    const history = [...messages, user];
    setMessages(history); setQuestion(""); setPending(true);
    try {
      const requestMessages = history.map(({ role, content: text }) => ({ role, content: text.slice(0, role === "user" ? MAX_USER_MESSAGE_LENGTH : MAX_ASSISTANT_HISTORY_LENGTH) })).slice(-8);
      const response = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: pathname, messages: requestMessages }) });
      const payload = await response.json() as { reply?: unknown; scope?: unknown; degraded?: unknown; sources?: unknown; error?: unknown };
      if (!response.ok || typeof payload.reply !== "string") {
        const errorMessage = typeof payload.error === "string" ? payload.error : "Jawaban belum dapat dimuat.";
        throw new Error(errorMessage.includes("Too big") ? "Pertanyaan terlalu panjang. Ringkas menjadi maksimal 2.000 karakter." : errorMessage);
      }
      const responseScope: Scope = payload.scope === "admin" ? "admin" : "public";
      const sources = Array.isArray(payload.sources) ? payload.sources.filter((item): item is Source => Boolean(item) && typeof item === "object" && typeof (item as Source).label === "string" && typeof (item as Source).href === "string") : [];
      setScope(responseScope);
      setMessages((current) => [...current, { id: id.current++, role: "assistant", content: payload.reply as string, scope: responseScope, degraded: payload.degraded === true, sources }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Asisten belum dapat dihubungi.";
      setMessages((current) => [...current, { id: id.current++, role: "assistant", content: errorMessage, scope, degraded: true }]);
    } finally { setPending(false); }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void send(question); };
  const prompts = scope === "admin" ? adminPrompts : publicPrompts;

  return <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-[99] flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6">
    <AnimatePresence initial={false}>{open ? <motion.aside id="opal-ai-assistant" role="dialog" aria-modal="false" aria-label="Asisten OPAL" initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 10 }} className="z-[99] flex h-[min(600px,calc(100dvh-11rem))] min-h-0 w-full flex-col overflow-hidden rounded-[1.25rem] border border-line bg-surface-raised text-ink shadow-[0_24px_70px_rgba(3,25,21,0.22)] sm:w-[25rem]">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5"><span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white" aria-hidden="true"><Image src="/images/logo AI.png" alt="" width={40} height={40} className="size-full object-cover" /></span><div className="min-w-0 flex-1"><h2 className="text-[0.95rem] font-extrabold text-ink">Asisten OPAL</h2><p className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-ink-muted"><CheckCircle size={13} weight="fill" className="text-brand" />{scope === "admin" ? "Admin RT terverifikasi" : "Informasi publik"}</p></div><button ref={closeRef} type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-muted hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Tutup Asisten OPAL"><X size={19} weight="bold" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5" aria-live="polite"><div className="border-l-2 border-brand pl-3.5"><p className="text-[0.92rem] font-extrabold text-ink">Tanya informasi OPAL.</p><p className="mt-1.5 text-[0.74rem] leading-5 text-ink-muted">Jawaban ditulis langsung dari isi portal. Akses admin ditentukan otomatis.</p></div><div className="mt-4 space-y-3">{messages.map((message) => <div key={message.id} className={`rounded-2xl px-3.5 py-3 text-[0.76rem] leading-6 ${message.role === "user" ? "ml-6 bg-action text-on-action" : "mr-2 border border-line bg-surface text-ink"}`}><p className="whitespace-pre-wrap">{message.content}</p>{message.role === "assistant" && message.degraded ? <p className="mt-2 text-[0.65rem] text-ink-faint">Mode fallback: jawaban tetap diambil dari data portal tanpa AI API.</p> : null}{message.role === "assistant" && message.sources?.length ? <div className="mt-3 border-t border-line pt-2"><p className="text-[0.62rem] font-extrabold uppercase text-ink-faint">Sumber portal</p><div className="mt-1.5 flex flex-col gap-1.5">{message.sources.map((source) => <span key={`${message.id}-${source.href}`} className="inline-flex max-w-full items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[0.62rem] font-bold text-brand-deep"><LinkSimple size={11} className="shrink-0" /><span className="truncate">{source.label}</span></span>)}</div></div> : null}</div>)}{pending ? <div className="mr-2 flex items-center gap-2 rounded-2xl border border-line px-3.5 py-3 text-[0.76rem] text-ink-muted"><CircleNotch className="animate-spin" size={16} />Mencari jawaban...</div> : null}<div ref={endRef} /></div></div>
      <div className="shrink-0 border-t border-line px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3.5 sm:px-5 sm:pb-5"><div className="mb-3 flex flex-wrap gap-1.5">{prompts.map((prompt) => <button key={prompt} type="button" disabled={pending} onClick={() => void send(prompt)} className="rounded-full border border-line px-2.5 py-1.5 text-left text-[0.63rem] font-bold text-brand-deep hover:border-brand hover:bg-brand-soft disabled:opacity-50">{prompt}</button>)}</div><form onSubmit={submit}><label htmlFor="opal-ai-question" className="sr-only">Tulis pertanyaan untuk Asisten OPAL</label><div className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"><input id="opal-ai-question" type="text" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={pending} maxLength={MAX_USER_MESSAGE_LENGTH} placeholder="Tulis pertanyaan untuk OPAL" className="min-w-0 flex-1 bg-transparent text-[0.8rem] text-ink outline-none placeholder:text-ink-faint" /><button type="submit" disabled={pending || !question.trim()} className="grid size-9 shrink-0 place-items-center rounded-lg bg-action text-on-action disabled:opacity-45" aria-label="Kirim pertanyaan"><ArrowUp size={17} weight="bold" /></button></div><p className="mt-2.5 text-[0.64rem] leading-5 text-ink-faint">Jawaban dari portal OPAL langsung di chat. Data KTP, KK, token, dan file bukti tidak diproses AI.</p></form></div>
    </motion.aside> : null}</AnimatePresence>
    <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-controls={open ? "opal-ai-assistant" : undefined} aria-expanded={open} aria-label={open ? "Sembunyikan Asisten OPAL" : "Buka Asisten OPAL"} className="group flex min-h-14 items-center gap-2 rounded-[1.15rem] border border-line bg-surface-raised px-2.5 pr-3.5 text-ink shadow-[0_14px_34px_rgba(3,25,21,0.2)] hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface"><span className="grid size-9 place-items-center overflow-hidden rounded-full bg-white" aria-hidden="true"><Image src="/images/logo AI.png" alt="" width={36} height={36} className="size-full object-cover" /></span><span className="hidden text-[0.76rem] font-extrabold sm:block">Tanya OPAL</span></button>
  </div>;
}
