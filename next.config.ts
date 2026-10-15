import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
  // The floating "N" dev badge only exists in `next dev`; hide it so local
  // screenshots (OG images, docs) are clean.
  devIndicators: false,
};

export default nextConfig;
