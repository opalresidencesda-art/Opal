"use client";

import { ArrowUp, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function OpalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [turn, setTurn] = useState(0);
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeAssistant = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const toggleAssistant = () => {
    setTurn((current) => current + 1);
    setIsOpen((current) => !current);
  };

  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAssistant();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/rumah/")) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.aside
            id="opal-ai-assistant"
            role="dialog"
            aria-modal="false"
            aria-label="Asisten OPAL"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[calc(100dvh-6rem)] w-full origin-bottom-right overflow-y-auto rounded-[1.25rem] border border-line bg-surface-raised text-ink shadow-[0_24px_70px_rgba(3,25,21,0.22)] sm:w-[25rem]"
          >
            <header className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white" aria-hidden="true">
                <Image src="/images/logo AI.png" alt="" width={40} height={40} sizes="40px" className="size-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.95rem] font-extrabold tracking-[-0.03em] text-ink">Asisten OPAL</h2>
                <p className="mt-0.5 text-[0.68rem] leading-5 text-ink-muted">Untuk informasi warga</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeAssistant}
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-muted transition hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
                aria-label="Tutup Asisten OPAL"
              >
                <X size={19} weight="bold" aria-hidden="true" />
              </button>
            </header>

            <div className="px-5 py-6">
              <div className="border-l-2 border-brand pl-4">
                <p className="text-[0.92rem] font-extrabold tracking-[-0.03em] text-ink">Asisten AI sedang disiapkan.</p>
                <p className="mt-2 max-w-[31rem] text-[0.76rem] leading-6 text-ink-muted">Nantinya Anda dapat bertanya tentang surat, iuran, dan panduan warga OPAL.</p>
              </div>
            </div>

            <form className="border-t border-line px-5 pb-5 pt-4" aria-describedby="opal-ai-assistant-status" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="opal-ai-question" className="sr-only">Tulis pertanyaan untuk Asisten OPAL</label>
              <div className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/25">
                <input
                  id="opal-ai-question"
                  type="text"
                  disabled
                  placeholder="Tulis pertanyaan untuk OPAL"
                  className="min-w-0 flex-1 bg-transparent text-[0.8rem] font-semibold text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed"
                />
                <button type="submit" disabled className="grid size-9 shrink-0 place-items-center rounded-lg bg-action text-on-action opacity-45" aria-label="Kirim pertanyaan">
                  <ArrowUp size={17} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <p id="opal-ai-assistant-status" className="mt-3 text-[0.65rem] leading-5 text-ink-faint">Pesan belum dapat dikirim pada tahap ini.</p>
            </form>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <button
        ref={triggerRef}
        type="button"
        onClick={toggleAssistant}
        aria-controls={isOpen ? "opal-ai-assistant" : undefined}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Sembunyikan Asisten OPAL" : "Buka Asisten OPAL"}
        className={`group flex min-h-14 items-center gap-2 rounded-[1.15rem] border px-2.5 pr-3.5 shadow-[0_14px_34px_rgba(3,25,21,0.2)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface ${isOpen ? "border-action bg-action text-on-action hover:bg-brand" : "border-line bg-surface-raised text-ink hover:border-brand hover:text-brand"}`}
      >
        <motion.span
          animate={reduceMotion ? { rotate: 0 } : { rotate: turn * 360 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white"
          aria-hidden="true"
        >
          <Image src="/images/logo AI.png" alt="" width={36} height={36} sizes="36px" className="size-full object-cover" />
        </motion.span>
        <span className="hidden whitespace-nowrap text-[0.76rem] font-extrabold sm:block">Tanya OPAL</span>
      </button>
    </div>
  );
}
