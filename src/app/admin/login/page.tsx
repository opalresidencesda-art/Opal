import { EnvelopeSimple, LockKey } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { requestMagicLink } from "@/app/admin/actions";
import { BrandMark } from "@/components/brand-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Masuk Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : "";
  const sent = params.sent === "1";
  const configured = isSupabaseConfigured();
  const notice = sent ? "Tautan masuk telah dikirim. Buka email tersebut di perangkat ini." : reason === "forbidden" ? "Email ini belum diberi akses admin OPAL." : reason === "error" ? "Tautan masuk belum dapat dikirim. Coba lagi beberapa saat lagi." : reason === "setup" ? "Supabase belum dikonfigurasi pada deployment ini." : "";

  return (
    <div className="mx-auto flex min-h-[68vh] max-w-[1440px] items-center px-5 py-12 sm:px-8 lg:px-10">
      <section className="w-full max-w-md border-y border-line bg-surface-raised px-6 py-8 sm:px-8 sm:py-10">
        <BrandMark />
        <div className="mt-10">
          <span className="grid size-11 place-items-center rounded-[14px] bg-brand-soft text-brand-deep"><LockKey size={24} weight="fill" aria-hidden="true" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.06em] text-ink">Masuk admin RT</h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">Gunakan email yang sudah didaftarkan sebagai admin. Tidak ada pendaftaran publik.</p>
        </div>
        {notice ? <p className="mt-6 border-l-2 border-brand bg-surface-subtle px-4 py-4 text-sm leading-6 text-ink-muted" role="status">{notice}</p> : null}
        <form action={requestMagicLink} className="mt-6">
          <label htmlFor="email" className="text-sm font-extrabold text-ink">Email admin</label>
          <div className="relative mt-2"><EnvelopeSimple className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={19} weight="fill" aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" required disabled={!configured} placeholder="nama@email.com" className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 pl-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60" /></div>
          <button type="submit" disabled={!configured} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-bold text-ink-inverse transition hover:-translate-y-0.5 hover:bg-brand active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">Kirim tautan masuk</button>
        </form>
        <Link href="/" className="mt-6 inline-block text-sm font-bold text-brand-deep hover:text-brand">Kembali ke portal warga</Link>
      </section>
    </div>
  );
}
