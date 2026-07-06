import type { NextConfig } from "next";
import path from "path";

const apiOrigin =
  process.env.API_URL?.replace(/\/$/, "") ??
  "https://ams-omwj.onrender.com";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["three", "gsap"],
  async rewrites() {
    return [
      {
        source: "/api/ams/:path*",
        destination: `${apiOrigin}/:path*`,
      },
      {
        source: "/api/surakshya/:path*",
        destination: "https://surakshya.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
