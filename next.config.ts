import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
