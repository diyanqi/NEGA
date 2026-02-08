import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/*.json$", "/admin/"],
        crawlDelay: 1,
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: [
      "https://negaapp.com/sitemap.xml",
      "https://negaapp.com/sitemap-en.xml",
      "https://negaapp.com/sitemap-zh.xml",
    ],
  };
}
