import { ArrowUpRight, Phone } from "@phosphor-icons/react/dist/ssr";
import { getPublishedStaff } from "@/lib/portal-services";

export const metadata = { title: "Petugas Pos & Taman" };

export default async function PetugasPage() {
  const staff = await getPublishedStaff();
  return <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:px-10 lg:py-16"><p className="text-sm font-semibold text-brand">Operasional lingkungan</p><h1 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.07em] text-ink sm:text-5xl">Petugas Pos & Taman.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">Direktori ini hanya memuat informasi kerja yang tersedia untuk warga. Tidak ada informasi keluarga atau data pribadi lain yang dipindahkan.</p><div className="mt-10 divide-y divide-line border-y border-line">{staff.map((person) => <article key={person.id ?? person.name} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-xl font-extrabold tracking-[-0.04em] text-ink">{person.name}</h2><p className="mt-1 text-sm text-ink-muted">{person.role}</p></div>{person.whatsapp ? <a href={`https://wa.me/${person.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line px-4 text-sm font-bold text-brand-deep hover:border-brand hover:bg-brand-soft sm:w-auto"><Phone size={17} weight="fill" /> Hubungi WhatsApp <ArrowUpRight size={15} weight="bold" /></a> : <span className="text-sm font-semibold text-ink-faint">Kontak belum tersedia</span>}</article>)}</div></main>;
}
