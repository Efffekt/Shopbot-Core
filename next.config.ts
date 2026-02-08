import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
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
