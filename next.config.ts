import type { NextConfig } from "next";

function originOf(value: string | undefined) {
  try {
    return value ? new URL(value).origin : "";
  } catch {
    return "";
  }
}

const supabaseOrigin = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL);
const productionContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://server.arcgisonline.com`,
  `connect-src 'self' ${supabaseOrigin} https://server.arcgisonline.com`,
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75, 90],
  },
  experimental: {
    serverActions: {
      // Allows multipart overhead while each signed-in admin image remains capped at 5 MB.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "same-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        { key: "Origin-Agent-Cluster", value: "?1" },
        ...(process.env.NODE_ENV === "production"
          ? [
            { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
            { key: "Content-Security-Policy", value: productionContentSecurityPolicy },
          ]
          : []),
      ],
    }];
  },
};

export default nextConfig;
