import type { NextConfig } from "next";
const config: NextConfig = {
  // Bound page-generation memory on local machines and free-tier builders.
  experimental: { cpus: 2 },
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
