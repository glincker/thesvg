import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategoryCounts, getIconsByCategory } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { Google2026Landing } from "@/components/landing/google-2026-landing";

const CDN_BASE = "https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons";
const CATEGORY = "Google 2026";
const SLUG = "google-2026";
const CANONICAL = `https://thesvg.org/category/${SLUG}`;

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const icons = getIconsByCategory(CATEGORY);
  const count = icons.length;
  // Title omits the " | theSVG" suffix — Next.js layout adds the siteName
  // automatically, so including it here causes "...theSVG | theSVG".
  const title = `Google 2026 Brand Icons — ${count} Official SVG Logos`;
  const description =
    `The complete Google 2026 brand refresh. ${count} official SVG icons: Gmail, ` +
    `Drive, Calendar, Meet, Docs, Sheets, Slides, Chat, Forms, Keep, Sites, Tasks, ` +
    `Vids, Voice and the Workspace mark. Free download with full gradient fidelity.`;

  return {
    title,
    description,
    keywords: [
      "google 2026 brand icons",
      "google 2026 logos",
      "google workspace 2026",
      "google workspace new logos",
      "gmail new logo svg",
      "google drive 2026 logo",
      "google calendar 2026 svg",
      "google meet new logo",
      "google brand refresh 2026",
      "google workspace brand kit",
      "google 2026 svg download",
      "free google 2026 icons",
    ],
    openGraph: {
      title,
      description,
      url: CANONICAL,
      type: "website",
      siteName: "theSVG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: CANONICAL },
  };
}

export default function Google2026CategoryPage() {
  const icons = getIconsByCategory(CATEGORY);
  const categoryCounts = getCategoryCounts();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${CANONICAL}#page`,
        name: "Google 2026 Brand Icons",
        description:
          `The complete Google 2026 brand refresh as official SVG icons. ` +
          `${icons.length} icons covering Gmail, Drive, Calendar, Meet, Docs, ` +
          `Sheets, Slides, Chat, Forms, Keep, Sites, Tasks, Vids, Voice and the ` +
          `Workspace mark.`,
        url: CANONICAL,
        isPartOf: {
          "@type": "WebSite",
          name: "theSVG",
          url: "https://thesvg.org",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://thesvg.org" },
            { "@type": "ListItem", position: 2, name: "Google 2026", item: CANONICAL },
          ],
        },
        mainEntity: {
          "@id": `${CANONICAL}#list`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${CANONICAL}#list`,
        name: "Google 2026 Brand Icons",
        numberOfItems: icons.length,
        itemListOrder: "https://schema.org/ItemListUnordered",
        itemListElement: icons.map((icon, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `https://thesvg.org/icon/${icon.slug}`,
          item: {
            "@type": "ImageObject",
            name: `${icon.title} SVG Icon`,
            contentUrl: `${CDN_BASE}/${icon.slug}/default.svg`,
            thumbnailUrl: `${CDN_BASE}/${icon.slug}/default.svg`,
            encodingFormat: "image/svg+xml",
            url: `https://thesvg.org/icon/${icon.slug}`,
          },
        })),
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
          <Google2026Landing icons={icons} />
        </SidebarShell>
      </Suspense>
    </>
  );
}
