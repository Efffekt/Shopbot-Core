import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

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
