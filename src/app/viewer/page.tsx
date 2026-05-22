import type { Metadata } from "next";
import { Suspense } from "react";
import { Zap } from "lucide-react";
import { getCategoryCounts, getCollections } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { SvgViewer } from "@/components/viewer/svg-viewer";

export const metadata: Metadata = {
  title: "SVG Viewer - Inspect, Preview, and Copy SVG Files",
  description:
    "Free online SVG viewer. Paste SVG XML or drop a file to preview, inspect viewBox and dimensions, count elements, detect gradients, and copy or download the result.",
  keywords: [
    "SVG viewer",
    "online SVG viewer",
    "SVG preview",
    "view SVG online",
    "SVG inspector",
    "SVG renderer",
    "open SVG file",
    "SVG XML viewer",
  ],
  openGraph: {
    title: "SVG Viewer | theSVG",
    description:
      "Free SVG viewer. Paste or drop an SVG, preview on any background, inspect dimensions and gradients, copy or download.",
    url: "https://thesvg.org/viewer",
    type: "website",
    siteName: "theSVG",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "theSVG Viewer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SVG Viewer | theSVG",
    description:
      "Free SVG viewer. Paste or drop, preview, inspect, copy.",
  },
  alternates: {
    canonical: "https://thesvg.org/viewer",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "theSVG Viewer",
  description:
    "Free in-browser SVG viewer and inspector. Preview, measure, copy, or download SVG files.",
  url: "https://thesvg.org/viewer",
  applicationCategory: "DesignApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "theSVG",
    url: "https://thesvg.org",
  },
};

export default function ViewerPage() {
  const categoryCounts = getCategoryCounts();
  const collections = getCollections();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <SidebarShell categoryCounts={categoryCounts} collections={collections}>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-400/10 via-orange-400/10 to-fuchsia-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-400/20 dark:text-amber-300">
                <Zap className="h-3 w-3" />
                Beta
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
                SVG Viewer
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Paste, drop, or import an SVG. Format the XML, preview on any
                background, inspect viewBox and dimensions, and open in your
                favorite editor. Everything runs in your browser. Nothing is
                uploaded.
              </p>
            </div>
            <SvgViewer />
          </div>
        </SidebarShell>
      </Suspense>
    </>
  );
}
