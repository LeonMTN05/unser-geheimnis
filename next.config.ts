import type { NextConfig } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,

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
              // 'unsafe-eval' braucht nur der Dev-Server (React Refresh)
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options",        value: "DENY" },
          // Veralteter XSS-Filter der Browser kann selbst Lücken öffnen → explizit aus
          { key: "X-XSS-Protection",       value: "0" },
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
        // Anfrage-Seiten: niemals cachen, niemals indexieren
        source: "/r/:id*",
        headers: [
          { key: "X-Robots-Tag",   value: "noindex, nofollow" },
          { key: "Cache-Control",  value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",         value: "no-cache" },
          { key: "Expires",        value: "0" },
        ],
      },
      {
        // Abruf-Seiten: niemals cachen, niemals indexieren
        source: "/abruf/:token*",
        headers: [
          { key: "X-Robots-Tag",   value: "noindex, nofollow" },
          { key: "Cache-Control",  value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",         value: "no-cache" },
          { key: "Expires",        value: "0" },
        ],
      },
      {
        // Bestätigen/Abmelden: niemals cachen, niemals indexieren
        source: "/anfrage/:path*",
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
