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

export const dynamicParams = false;

const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";

// Map our string licenses to canonical URLs so structured data passes
// Google's "Invalid URL in field 'license'" check.
const LICENSE_URLS: Record<string, string> = {
  "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "MIT": "https://spdx.org/licenses/MIT.html",
  "CC-BY-ND-2.0": "https://creativecommons.org/licenses/by-nd/2.0/",
  "CC-BY-ND-4.0": "https://creativecommons.org/licenses/by-nd/4.0/",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC-BY-3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC-BY-2.5": "https://creativecommons.org/licenses/by/2.5/",
  "CC-BY-SA-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC-BY-SA-3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC-BY-SA-2.5": "https://creativecommons.org/licenses/by-sa/2.5/",
  "CC-BY-SA-2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "CC-BY-NC-4.0": "https://creativecommons.org/licenses/by-nc/4.0/",
  "CC-BY-NC-SA-4.0": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "CC-BY-NC-SA-3.0": "https://creativecommons.org/licenses/by-nc-sa/3.0/",
  "CC-BY-NC-ND-4.0": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  "Apache-2.0": "https://spdx.org/licenses/Apache-2.0.html",
  "GPL-2.0": "https://spdx.org/licenses/GPL-2.0-only.html",
  "GPL-2.0-only": "https://spdx.org/licenses/GPL-2.0-only.html",
  "GPL-2.0-or-later": "https://spdx.org/licenses/GPL-2.0-or-later.html",
  "GPL-3.0": "https://spdx.org/licenses/GPL-3.0-only.html",
  "GPL-3.0-only": "https://spdx.org/licenses/GPL-3.0-only.html",
  "GPL-3.0-or-later": "https://spdx.org/licenses/GPL-3.0-or-later.html",
  "LGPL-2.1": "https://spdx.org/licenses/LGPL-2.1-only.html",
  "LGPL-3.0": "https://spdx.org/licenses/LGPL-3.0-only.html",
  "AGPL-3.0": "https://spdx.org/licenses/AGPL-3.0-only.html",
  "AGPL-3.0-only": "https://spdx.org/licenses/AGPL-3.0-only.html",
  "AGPL-3.0-or-later": "https://spdx.org/licenses/AGPL-3.0-or-later.html",
  "MPL-2.0": "https://spdx.org/licenses/MPL-2.0.html",
  "BSD-2-Clause": "https://spdx.org/licenses/BSD-2-Clause.html",
  "BSD-3-Clause": "https://spdx.org/licenses/BSD-3-Clause.html",
  "Unlicense": "https://spdx.org/licenses/Unlicense.html",
  "PD": "https://creativecommons.org/publicdomain/mark/1.0/",
  "brand-use": "https://thesvg.org/legal#trademark",
  "Fair Use": "https://thesvg.org/legal#fair-use",
  "Fair use": "https://thesvg.org/legal#fair-use",
  "Custom": "https://thesvg.org/legal",
  "Proprietary": "https://thesvg.org/legal#trademark",
  "Unknown": "https://thesvg.org/legal",
  "TODO": "https://thesvg.org/legal",
};

function licenseToUrl(license: string | undefined): string {
  if (!license) return "https://thesvg.org/legal";
  return LICENSE_URLS[license] || "https://thesvg.org/legal";
}

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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  const licenseUrl = licenseToUrl(icon.license);
  const year = new Date().getFullYear();
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
        license: licenseUrl,
        acquireLicensePage: "https://thesvg.org/legal",
        copyrightNotice: `${icon.title} logo © ${year} ${icon.title}. Distributed under ${icon.license}.`,
        creditText: icon.title,
        width: "512",
        height: "512",
        ...(icon.url ? { sameAs: [icon.url] } : {}),
        keywords: allKeywords.join(", "),
        creator: {
          "@type": "Organization",
          name: "theSVG",
          url: "https://thesvg.org",
        },
        copyrightHolder: {
          "@type": "Organization",
          name: icon.title,
          ...(icon.url ? { url: icon.url } : {}),
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
