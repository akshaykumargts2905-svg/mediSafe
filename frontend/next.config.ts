import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  redirects() {
    return [
      { source: "/interaction", destination: "/interactions", permanent: false },
      { source: "/prescription", destination: "/prescriptions/upload", permanent: false },
      { source: "/results", destination: "/prescriptions", permanent: false },
    ];
  },
  async rewrites() {
    const backend = (process.env.MEDISAFE_API_URL || "http://localhost:5000").replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/api-health", destination: backend + "/" },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
