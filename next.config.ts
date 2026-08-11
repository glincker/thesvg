import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
