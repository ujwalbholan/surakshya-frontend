import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_URL?.replace(/\/$/, "") ??
  "https://ams-omwj.onrender.com";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    ];
  },
};

export default nextConfig;
