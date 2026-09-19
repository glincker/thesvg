import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/lib/docs-content";
import { JsonLd } from "@/components/json-ld";
import { FaqList } from "@/components/docs/faq-list";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Licensing, missing variants, rate limits, self-hosting, and other common questions about theSVG.",
  openGraph: { title: "FAQ - theSVG Docs", description: "Common questions about theSVG.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/faq" },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <article className="max-w-3xl">
      <JsonLd data={faqJsonLd} />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">FAQ</h1>
        <DocsAskAi pageTitle="FAQ" />
      </div>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        Common questions about theSVG.
      </p>
      <FaqList items={FAQ_ITEMS} />
      <DocsPageFooter sourceFile="src/lib/docs-content.ts" pageTitle="FAQ" />
    </article>
  );
}
