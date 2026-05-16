import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Global safety net: bypass Vercel's image optimization service entirely
    // so we never burn through the monthly transformations quota. Every
    // <Image> renders as a plain img tag pointing at the original source.
    //
    // Rationale:
    //   - All images we display are MX thumbnails from trackmania.exchange.
    //     MX already serves pre-compressed JPEGs and handles its own CDN
    //     traffic — running them through Vercel just consumed our quota
    //     without meaningfully improving anything users see.
    //   - The per-<Image> `unoptimized` props are still set throughout the
    //     codebase as documentation; this flag is the guarantee.
    //   - If we ever add a large local hero image / OG photo that genuinely
    //     benefits from WebP/AVIF conversion, flip this off and opt-in
    //     per-image via `unoptimized={false}`.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "trackmania.exchange" },
    ],
  },
};

export default nextConfig;
