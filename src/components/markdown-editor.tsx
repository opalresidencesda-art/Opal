"use client";

import { Eye, PencilSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { MarkdownContent } from "@/components/markdown-content";

export function MarkdownEditor({ name, defaultValue, label }: { name: string; defaultValue: string; label: string }) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={name} className="text-sm font-extrabold text-ink">{label}</label>
        <button type="button" onClick={() => setPreview((current) => !current)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-bold text-brand-deep transition hover:bg-brand-soft">
          {preview ? <PencilSimple size={15} weight="bold" aria-hidden="true" /> : <Eye size={15} weight="bold" aria-hidden="true" />}
          {preview ? "Tulis" : "Pratinjau"}
        </button>
      </div>
      {preview ? (
        <><input type="hidden" name={name} value={value} /><div className="mt-3 min-h-64 border-y border-line bg-surface-subtle p-5"><MarkdownContent>{value}</MarkdownContent></div></>
      ) : (
        <textarea id={name} name={name} value={value} onChange={(event) => setValue(event.target.value)} rows={15} className="mt-3 min-h-64 w-full resize-y rounded-xl border border-line bg-surface p-4 font-mono text-sm leading-6 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/15" />
      )}
    </div>
  );
}
