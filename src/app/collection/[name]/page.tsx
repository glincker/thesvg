import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAllIcons,
  getCategoryCounts,
  getIconCount,
  getRecentlyAddedIcons,
  getCollections,
  type Collection,
} from "@/lib/icons";
import { HomeContent } from "@/components/home-content";

const COLLECTION_META: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  aws: {
    title: "AWS Architecture Icons - Free SVG Download",
    description:
      "Browse and download 739 official AWS Architecture SVG icons. Lambda, EC2, S3, RDS, DynamoDB, and all AWS services. Free for developers. Copy as SVG, JSX, React component, or CDN link.",
    keywords: [
      "AWS icons",
      "AWS architecture icons",
      "AWS SVG",
      "AWS Lambda icon",
      "Amazon EC2 icon",
      "AWS service icons",
      "cloud architecture icons",
      "AWS diagram icons",
    ],
  },
  azure: {
    title: "Microsoft Azure Icons - Free SVG Download",
    description:
      "Browse and download 626 official Microsoft Azure service SVG icons. Virtual Machines, App Services, Azure SQL, Cosmos DB, and all Azure services. Free for developers.",
    keywords: [
      "Azure icons",
      "Microsoft Azure icons",
      "Azure SVG",
      "Azure service icons",
      "Azure architecture icons",
      "cloud icons",
      "Azure VM icon",
      "Azure Functions icon",
    ],
  },
  gcp: {
    title: "Google Cloud Platform Icons - Free SVG Download",
    description:
      "Browse and download 214 Google Cloud Platform SVG icons. Compute Engine, BigQuery, Cloud Run, GKE, and all GCP services. Free for developers.",
    keywords: [
      "GCP icons",
      "Google Cloud icons",
      "GCP SVG",
      "Google Cloud Platform icons",
      "BigQuery icon",
      "Cloud Run icon",
      "GKE icon",
      "cloud architecture icons",
    ],
  },
  brands: {
    title: "Brand SVG Icons - Free Logo Download",
    description:
      "Browse and download 4,019 brand SVG icons. GitHub, Stripe, Vercel, Docker, React, and thousands more. Multiple variants: color, mono, dark, light, wordmark.",
    keywords: [
      "brand icons",
      "brand SVG",
      "logo SVG",
      "brand logos",
      "free logo download",
      "SVG icons",
      "developer icons",
    ],
  },
};

const VALID_COLLECTIONS = ["aws", "azure", "gcp", "brands"] as const;
type ValidCollection = (typeof VALID_COLLECTIONS)[number];

function isValidCollection(name: string): name is ValidCollection {
  return (VALID_COLLECTIONS as readonly string[]).includes(name);
}

export function generateStaticParams() {
  return VALID_COLLECTIONS.map((name) => ({ name }));
}

export const dynamicParams = false;

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const meta = COLLECTION_META[name];
  if (!meta) return {};

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: `${meta.title} | theSVG`,
      description: meta.description,
      url: `https://thesvg.org/collection/${name}`,
      type: "website",
      siteName: "theSVG",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `https://thesvg.org/collection/${name}`,
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { name } = await params;

  if (!isValidCollection(name)) {
    notFound();
  }

  const icons = getAllIcons();
  const categoryCounts = getCategoryCounts();
  const iconCount = getIconCount();
  const recentIcons = getRecentlyAddedIcons(12);
  const collections = getCollections();

  const collectionName = name as Collection;
  const meta = COLLECTION_META[name];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta?.title,
    description: meta?.description,
    url: `https://thesvg.org/collection/${name}`,
    isPartOf: {
      "@type": "WebSite",
      name: "theSVG",
      url: "https://thesvg.org",
    },
    numberOfItems: icons.filter((i) => i.collection === name).length,
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
          icons={icons}
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
