import type { MetadataRoute } from "next";
import { getAllCategories, getAllIcons } from "@/lib/icons";
import { slugifyCategory } from "@/lib/categories";
import postsData from "@/data/posts.json";

export const dynamic = "force-static";

const BASE_URL = "https://thesvg.org";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

// Single sitemap output at /sitemap.xml. We previously used generateSitemaps
// to shard by collection, but that path doesn't export cleanly with
// output: "export" on GitHub Pages (the sharded files end up at
// /sitemap/N.xml and the index is missing), so robots.txt-discovery breaks.
// One sitemap fits comfortably under the 50,000-URL and 50MB Google limits
// for our ~6,100 icons + the static pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const icons = getAllIcons();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/viewer`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/extensions`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const collectionPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/collection/brands`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/collection/aws`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/collection/azure`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/collection/gcp`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/collection/k8s`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];

  const categorySlugs = new Set<string>();
  for (const cat of getAllCategories()) {
    const slug = slugifyCategory(cat);
    if (slug) categorySlugs.add(slug);
  }
  const categoryPages: MetadataRoute.Sitemap = [...categorySlugs].map(
    (slug) => ({
      url: `${BASE_URL}/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: slug === "google-2026" ? 0.95 : 0.7,
    }),
  );

  const blogPages: MetadataRoute.Sitemap = (
    postsData as { slug: string; date: string }[]
  ).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const iconPages: MetadataRoute.Sitemap = icons.map((icon) => ({
    url: `${BASE_URL}/icon/${icon.slug}`,
    lastModified: icon.dateAdded ? new Date(icon.dateAdded) : now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
    images: [`${CDN_BASE}/${icon.slug}/default.svg`],
  }));

  return [
    ...staticPages,
    ...collectionPages,
    ...categoryPages,
    ...blogPages,
    ...iconPages,
  ];
}
