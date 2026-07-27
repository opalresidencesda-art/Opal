import Image from "next/image";
import Link from "next/link";

export function BrandMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="OPAL Residence, ke beranda"
      className={`relative block shrink-0 overflow-hidden rounded-full shadow-[0_8px_24px_rgba(2,20,16,0.2)] ${compact ? "size-12" : "size-14"} ${inverse ? "focus-visible:ring-brand-highlight focus-visible:ring-offset-action" : "focus-visible:ring-brand focus-visible:ring-offset-surface"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4`}
    >
      <Image
        src="/images/opal_official_logo.png"
        alt=""
        fill
        priority={compact}
        sizes={compact ? "48px" : "56px"}
        className={`object-cover object-center ${inverse ? "" : "invert"}`}
      />
    </Link>
  );
}
