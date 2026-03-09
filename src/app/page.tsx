import { Suspense } from "react";
import { getAllIcons, getCategoryCounts, getIconCount } from "@/lib/icons";
import { HomeContent } from "@/components/home-content";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "theSVG",
      url: "https://thesvg.org",
      description:
        "Free, open-source library of 3,847 brand SVG icons. Search, copy, and ship brand icons with npm packages, React components, CLI, CDN, and MCP server.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://thesvg.org/?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "theSVG",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: "https://thesvg.org",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      softwareVersion: "1.0",
      creator: {
        "@type": "Organization",
        name: "GLINCKER",
        url: "https://github.com/GLINCKER",
      },
    },
  ],
};

export default function Home() {
  const icons = getAllIcons();
  const categoryCounts = getCategoryCounts();
  const count = getIconCount();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <HomeContent icons={icons} categoryCounts={categoryCounts} count={count} />
      </Suspense>
    </>
  );
}
