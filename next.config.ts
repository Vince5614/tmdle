import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "trackmania.exchange" },
    ],
  },
};

export default nextConfig;
