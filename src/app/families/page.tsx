import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { BrowseSuspense } from "@/components/skeletons";
import { FamiliesIndex } from "@/components/family/families-index";
import { FAMILY_THEME, getOtherFamilies } from "@/lib/families";
import { getCategoryCounts } from "@/lib/icons";

export const dynamic = "force-static";

const URL = "https://thesvg.org/families";

export function generateMetadata(): Metadata {
  const count = getOtherFamilies("", 100).length;
  const title = `Brand families: ${count} companies, every logo in one place`;
  const description =
    "Official SVG logos grouped by the company that owns them: Amazon, Google, Microsoft, Apple, Meta, Adobe and more. Every product and variant, free to copy and ship.";
  return {
    title,
    description,
    alternates: { canonical: URL },
    openGraph: {
      title: `${title} | theSVG`,
      description,
      url: URL,
      type: "website",
      siteName: "theSVG",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function FamiliesPage() {
  const families = getOtherFamilies("", 100).map((f) => ({
    ...f,
    tagline: FAMILY_THEME[f.slug]?.tagline ?? `Everything ${f.title} in one place`,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Brand families",
    url: URL,
    isPartOf: { "@type": "WebSite", name: "theSVG", url: "https://thesvg.org" },
    numberOfItems: families.length,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: families.map((f, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${f.title} family`,
        url: `https://thesvg.org/family/${f.slug}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <BrowseSuspense>
        <SidebarShell categoryCounts={getCategoryCounts()}>
          <FamiliesIndex families={families} />
        </SidebarShell>
      </BrowseSuspense>
    </>
  );
}
