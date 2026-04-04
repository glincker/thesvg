import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllIcons, getIconBySlug, getIconsByCategory, getCategoryCounts } from "@/lib/icons";
import { IconDetailPage } from "@/components/icons/icon-detail-page";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const icons = getAllIcons();
  return icons.map((icon) => ({ slug: icon.slug }));
}

const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const icon = getIconBySlug(slug);
  if (!icon) return {};

  const variantCount = Object.values(icon.variants).filter(Boolean).length;
  const variantNames = Object.keys(icon.variants)
    .filter((k) => icon.variants[k as keyof typeof icon.variants])
    .map((k) => k === "default" ? "color" : k);
  const categoryList = icon.categories.join(", ");
  const cdnImage = `${CDN_BASE}/${slug}/default.svg`;

  const collectionText =
    icon.collection === "aws"
      ? " Part of the AWS Architecture icon collection."
      : icon.collection === "azure"
        ? " Part of the Azure Services icon collection."
        : icon.collection === "gcp"
          ? " Part of the Google Cloud icon collection."
          : "";

  const description =
    `Download the official ${icon.title} SVG icon for free. ` +
    `${variantCount} variant${variantCount !== 1 ? "s" : ""} (${variantNames.join(", ")})` +
    (categoryList ? ` in ${categoryList}` : "") +
    ". Copy as SVG, JSX, Vue, CDN link, or Data URI. Export PNG at 32-512px. " +
    `Use the ${icon.title} logo in React, Vue, or via jsDelivr CDN. Open-source brand icon library.` +
    collectionText;

  const title = `${icon.title} SVG Icon - Free Download | Official Logo SVG | theSVG`;

  return {
    title,
    description,
    keywords: [
      icon.title,
      icon.slug,
      ...icon.aliases,
      ...icon.categories,
      `${icon.title} SVG`,
      `${icon.title} icon`,
      `${icon.title} logo`,
      `${icon.title} logo SVG`,
      `${icon.title} SVG download`,
      `${icon.title} brand icon`,
      `${icon.title} icon free`,
      "SVG icon",
      "brand icon",
      "free SVG",
      "logo SVG",
      "brand logo download",
      "official icon SVG",
      "open source icons",
    ],
    openGraph: {
      title,
      description,
      url: `https://thesvg.org/icon/${slug}`,
      type: "website",
      siteName: "theSVG",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${icon.title} SVG Icon - theSVG`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `https://thesvg.org/icon/${slug}`,
    },
  };
}

export default async function IconPage({ params }: PageProps) {
  const { slug } = await params;
  const icon = getIconBySlug(slug);
  if (!icon) notFound();

  const primaryCategory = icon.categories[0] ?? null;
  const relatedIcons = primaryCategory
    ? getIconsByCategory(primaryCategory)
        .filter((rel) => rel.slug !== icon.slug)
        .slice(0, 8)
    : [];

  const categoryCounts = getCategoryCounts();

  const variantCount = Object.values(icon.variants).filter(Boolean).length;
  const categoryList = icon.categories.join(", ");
  const allKeywords = [
    icon.title,
    `${icon.title} SVG`,
    `${icon.title} icon`,
    `${icon.title} logo`,
    ...icon.aliases,
    ...icon.categories,
    "SVG",
    "icon",
    "logo",
    "brand",
    "free download",
    "open source",
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": `https://thesvg.org/icon/${slug}#image`,
        name: `${icon.title} SVG Icon`,
        description: `Free ${icon.title} SVG brand icon. ${variantCount} variants available. Download as SVG, JSX, Vue, CDN URL, or Data URI. Export PNG at multiple sizes.`,
        contentUrl: `${CDN_BASE}/${slug}/default.svg`,
        thumbnailUrl: `${CDN_BASE}/${slug}/default.svg`,
        url: `https://thesvg.org/icon/${slug}`,
        encodingFormat: "image/svg+xml",
        license: icon.license,
        width: "512",
        height: "512",
        ...(icon.url ? { sameAs: [icon.url] } : {}),
        keywords: allKeywords.join(", "),
        creator: {
          "@type": "Organization",
          name: "theSVG",
          url: "https://thesvg.org",
        },
      },
      {
        "@type": "WebPage",
        "@id": `https://thesvg.org/icon/${slug}`,
        name: `${icon.title} SVG Icon - Free Download`,
        description: `Download the official ${icon.title} SVG icon for free. ${variantCount} variants${categoryList ? ` in ${categoryList}` : ""}. Open-source brand icon library.`,
        url: `https://thesvg.org/icon/${slug}`,
        primaryImageOfPage: {
          "@id": `https://thesvg.org/icon/${slug}#image`,
        },
        isPartOf: {
          "@type": "WebSite",
          name: "theSVG",
          url: "https://thesvg.org",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://thesvg.org",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: icon.categories[0] ?? "Icons",
              item: icon.categories[0]
                ? `https://thesvg.org/?category=${encodeURIComponent(icon.categories[0])}`
                : "https://thesvg.org",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: `${icon.title} SVG Icon`,
              item: `https://thesvg.org/icon/${slug}`,
            },
          ],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <SidebarShell categoryCounts={categoryCounts}>
          <IconDetailPage icon={icon} relatedIcons={relatedIcons} />
        </SidebarShell>
      </Suspense>
    </>
  );
}
