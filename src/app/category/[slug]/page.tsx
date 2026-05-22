import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAllCategories,
  getCategoryCounts,
  getCollections,
  getIconCount,
  getIconsByCategory,
  getRecentlyAddedIcons,
} from "@/lib/icons";
import { HomeContent } from "@/components/home-content";

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

function buildSlugMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of getAllCategories()) {
    const slug = slugifyCategory(cat);
    if (!slug) continue;
    if (map.has(slug)) continue;
    map.set(slug, cat);
  }
  return map;
}

export function generateStaticParams() {
  return [...buildSlugMap().keys()].map((slug) => ({ slug }));
}

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = buildSlugMap().get(slug);
  if (!category) return {};

  const iconCount = getIconsByCategory(category).length;
  const title = `${category} SVG Icons - Free Download (${iconCount} icons)`;
  const description = `Browse and download ${iconCount} ${category} SVG icons. Free for personal and commercial use. Copy as SVG, JSX, React component, or CDN link.`;

  return {
    title,
    description,
    keywords: [
      `${category} icons`,
      `${category} SVG`,
      `${category} logos`,
      "free SVG icons",
      "brand icons",
      "developer icons",
    ],
    openGraph: {
      title: `${title} | theSVG`,
      description,
      url: `https://thesvg.org/category/${slug}`,
      type: "website",
      siteName: "theSVG",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://thesvg.org/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = buildSlugMap().get(slug);
  if (!category) notFound();

  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();
  const recentIcons = getRecentlyAddedIcons(12);
  const collections = getCollections();
  const categoryItemCount = getIconsByCategory(category).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} SVG Icons`,
    description: `Free ${category} SVG icons for download.`,
    url: `https://thesvg.org/category/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "theSVG",
      url: "https://thesvg.org",
    },
    numberOfItems: categoryItemCount,
    provider: {
      "@type": "Organization",
      name: "theSVG",
      url: "https://thesvg.org",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <HomeContent
          categoryCounts={categoryCounts}
          count={iconCount}
          recentIcons={recentIcons}
          collections={collections}
          defaultCategory={category}
          defaultCategorySlug={slug}
        />
      </Suspense>
    </>
  );
}
