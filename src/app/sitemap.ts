import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = ["", "/search", "/requests", "/register", "/login"];
  const locales = ["", "/en"];

  return locales.flatMap((prefix) =>
    paths.map((path) => ({
      url: `${siteUrl}${prefix}${path}`,
      changeFrequency: "daily" as const,
    }))
  );
}
