import type { NextConfig } from "next";
const config: NextConfig = {
  // Bound page-generation memory on local machines and free-tier builders.
  experimental: { cpus: 2 },
  poweredByHeader: false,
  async headers() {
    const development = process.env.NODE_ENV === "development";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), payment=(), microphone=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'${development ? " ws: wss:" : ""}; worker-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
          ...(!development
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.CHORD_API_ORIGIN || "http://127.0.0.1:8000"}/api/v1/:path*`,
      },
    ];
  },
};
export default config;
