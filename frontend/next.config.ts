import type { NextConfig } from "next";
import path from "path";

const surakshyaOrigin =
  process.env.SURAKSHYA_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

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
        source: "/api/surakshya/:path*",
        destination: `${surakshyaOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
