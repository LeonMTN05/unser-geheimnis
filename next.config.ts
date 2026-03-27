import type { NextConfig } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        // Security Headers für alle Routen
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
            ].join("; "),
          },
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "no-referrer" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Geheimnis-Seiten: niemals cachen, niemals indexieren
        source: "/s/:id*",
        headers: [
          { key: "X-Robots-Tag",   value: "noindex, nofollow" },
          { key: "Cache-Control",  value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",         value: "no-cache" },
          { key: "Expires",        value: "0" },
        ],
      },
      {
        // API: CORS per Env-Var, kein Caching
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: SITE_URL },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
