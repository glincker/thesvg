import type { MetadataRoute } from "next";
import { getAllIcons } from "@/lib/icons";
import postsData from "@/data/posts.json";

export const dynamic = "force-static";

const BASE_URL = "https://thesvg.org";
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

// Next.js will generate /sitemap/0.xml, /sitemap/1.xml, etc.
// Sitemaps: 0=static pages, 1=brands, 2=aws, 3=azure, 4=gcp
export async function generateSitemaps() {
  return [
    { id: 0 }, // static pages
    { id: 1 }, // brand icons
    { id: 2 }, // aws icons
    { id: 3 }, // azure icons
    { id: 4 }, // gcp icons
  ];
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  const now = new Date();
  const icons = getAllIcons();

  if (id === 0) {
    // Static pages only - category ?category=foo querystrings are omitted
    // as they are duplicate content of / from a search engine perspective.
    const staticPages: MetadataRoute.Sitemap = [
      { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
      { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
      { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/extensions`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
      { url: `${BASE_URL}/submit`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
      { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
      { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ];

    const blogPages: MetadataRoute.Sitemap = (
      postsData as { slug: string; date: string }[]
    ).map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    // Collection landing pages (proper URL paths for indexing)
    const collectionPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/collection/brands`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
      { url: `${BASE_URL}/collection/aws`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
      { url: `${BASE_URL}/collection/azure`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
      { url: `${BASE_URL}/collection/gcp`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    ];

    return [...staticPages, ...collectionPages, ...blogPages];
  }

  // Map id to collection
  const collectionMap: Record<number, string> = {
    1: "brands",
    2: "aws",
    3: "azure",
    4: "gcp",
  };

  const collection = collectionMap[id];
  if (!collection) return [];

  return icons
    .filter((icon) => icon.collection === collection)
    .map((icon) => ({
      url: `${BASE_URL}/icon/${icon.slug}`,
      lastModified: icon.dateAdded ? new Date(icon.dateAdded) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [`${CDN_BASE}/${icon.slug}/default.svg`],
    }));
}
