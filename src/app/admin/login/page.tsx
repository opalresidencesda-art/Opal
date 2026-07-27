import { ArrowLeft, CheckCircle, EnvelopeSimple, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { signInAdmin } from "@/app/admin/actions";
import { BrandMark } from "@/components/brand-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Masuk Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : "";
  const configured = isSupabaseConfigured();
  const notice = reason === "forbidden" ? "Akun ini belum diberi akses admin OPAL." : reason === "credentials" ? "Email atau kata sandi tidak cocok." : reason === "setup" ? "Supabase belum dikonfigurasi pada deployment ini." : "";

  return (
    <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-[1600px] bg-surface lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
      <section className="hero-image-drift relative hidden min-h-[44rem] overflow-hidden bg-action lg:block" aria-label="Lingkungan OPAL Residence">
        <Image
          src="/images/opal-arrival-evening.png"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,35,29,0.28),rgba(3,35,29,0.9))]" />
        <div className="absolute inset-0 flex flex-col justify-between p-12 xl:p-16">
          <BrandMark inverse />
          <div className="max-w-xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand-highlight">Ruang kerja pengurus</p>
            <h2 className="mt-5 max-w-lg text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-ink-inverse xl:text-6xl">
              Kelola data warga dan layanan lingkungan.
            </h2>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-6 text-sm font-semibold text-ink-inverse/78">
              <span className="inline-flex items-center gap-2"><CheckCircle className="text-brand-highlight" size={18} weight="fill" aria-hidden="true" />Akses terbatas</span>
              <span className="inline-flex items-center gap-2"><CheckCircle className="text-brand-highlight" size={18} weight="fill" aria-hidden="true" />Data warga terlindungi</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
            <ShieldCheck size={27} weight="fill" aria-hidden="true" />
          </span>
          <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Admin OPAL</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em] text-ink sm:text-5xl">Masuk ke portal admin.</h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">Gunakan akun yang diberikan pengurus. Portal admin tidak menyediakan pendaftaran publik.</p>

          {notice ? <p className="mt-6 border-l-2 border-brand bg-surface-subtle px-4 py-4 text-sm leading-6 text-ink-muted" role="status">{notice}</p> : null}

          <form action={signInAdmin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-extrabold text-ink">Email admin</label>
              <div className="relative mt-2">
                <EnvelopeSimple className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={19} weight="fill" aria-hidden="true" />
                <input id="email" name="email" type="email" autoComplete="email" required disabled={!configured} placeholder="nama@email.com" className="min-h-13 w-full rounded-2xl border border-line bg-surface-raised px-4 pl-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-extrabold text-ink">Kata sandi</label>
              <div className="relative mt-2">
                <LockKey className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={19} weight="fill" aria-hidden="true" />
                <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!configured} className="min-h-13 w-full rounded-2xl border border-line bg-surface-raised px-4 pl-11 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60" />
              </div>
            </div>
            <button type="submit" disabled={!configured} className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-action px-5 text-sm font-bold text-on-action transition duration-300 hover:-translate-y-0.5 hover:bg-brand hover:text-on-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">Masuk ke admin</button>
          </form>

          <Link href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-brand-deep transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-surface">
            <ArrowLeft size={17} weight="bold" aria-hidden="true" />
            Kembali ke portal warga
          </Link>
        </div>
      </section>
    </div>
  );
}
