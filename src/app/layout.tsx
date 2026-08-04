import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "OPAL Residence | Portal Warga",
    template: "%s | OPAL Residence",
  },
  description: "Pusat informasi, panduan, dan layanan warga OPAL Residence, Sidoarjo.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/images/logo AI.png",
    shortcut: "/images/logo AI.png",
    apple: "/images/logo AI.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="flex min-h-[100dvh] flex-col">
        <AppProviders>
          <a href="#main-content" className="skip-link">Lewati ke isi utama</a>
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
