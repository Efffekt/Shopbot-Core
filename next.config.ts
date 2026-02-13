import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },

  // Rewrite /widget.js to the API route for a clean embed URL
  async rewrites() {
    return [
      {
        source: "/widget.js",
        destination: "/api/widget",
      },
    ];
  },
};

export default nextConfig;
