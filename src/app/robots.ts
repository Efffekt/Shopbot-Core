import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api/", "/login", "/glemt-passord", "/tilbakestill-passord"],
      },
    ],
    sitemap: "https://preik.ai/sitemap.xml",
  };
}
