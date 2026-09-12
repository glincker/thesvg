import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getCategoryCounts,
  getIconCount,
  getRecentlyAddedIcons,
  getCollections,
  getCollectionCount,
  type Collection,
} from "@/lib/icons";
import { COLLECTION_IDS, COLLECTIONS_META, isValidCollectionId } from "@/lib/collections-meta";
import { HomeContent } from "@/components/home-content";

// The set of collections with a static page is derived from the shared
// collections-meta config, so adding a collection there is enough to get
// it a working `/collection/[name]` page - no allowlist to remember to
// update separately (that drift is what caused /collection/community to
// 404 in production).
export function generateStaticParams() {
  return COLLECTION_IDS.map((name) => ({ name }));
}

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const meta = COLLECTIONS_META[name as Collection];
  if (!meta) return {};

  return {
    title: meta.pageTitle,
    description: meta.pageDescription,
    keywords: meta.pageKeywords,
    openGraph: {
      title: `${meta.pageTitle} | theSVG`,
      description: meta.pageDescription,
      url: `https://thesvg.org/collection/${name}`,
      type: "website",
      siteName: "theSVG",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: meta.pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.pageTitle,
      description: meta.pageDescription,
    },
    alternates: {
      canonical: `https://thesvg.org/collection/${name}`,
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { name } = await params;

  if (!isValidCollectionId(name)) {
    notFound();
  }

  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();
  const recentIcons = getRecentlyAddedIcons(12);
  const collections = getCollections();

  const collectionName = name as Collection;
  const meta = COLLECTIONS_META[collectionName];
  const collectionItemCount = getCollectionCount(collectionName);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta?.pageTitle,
    description: meta?.pageDescription,
    url: `https://thesvg.org/collection/${name}`,
    isPartOf: {
      "@type": "WebSite",
      name: "theSVG",
      url: "https://thesvg.org",
    },
    numberOfItems: collectionItemCount,
    provider: {
      "@type": "Organization",
      name: "theSVG",
      url: "https://thesvg.org",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Suspense>
        <HomeContent
          categoryCounts={categoryCounts}
          count={iconCount}
          recentIcons={recentIcons}
          collections={collections}
          defaultCollection={collectionName}
        />
      </Suspense>
    </>
  );
}
