import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs in CI
  silent: !process.env.CI,

  // Upload source maps to Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Automatically tree-shake Sentry logger in production
  disableLogger: true,
});
