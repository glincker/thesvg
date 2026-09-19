import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Package as PackageIcon } from "lucide-react";
import { FRAMEWORK_GUIDES, FAQ_ITEMS } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";
import { GUIDE_RELATED_FAQ } from "@/lib/docs-related-faq";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return FRAMEWORK_GUIDES.map((guide) => ({ slug: guide.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = FRAMEWORK_GUIDES.find((g) => g.id === slug);
  if (!guide) return {};
  return {
    title: guide.label,
    description: guide.summary,
    keywords: [`${guide.label} brand icons`, `${guide.label} SVG icons`, "theSVG"],
    openGraph: { title: guide.label, description: guide.summary, siteName: "theSVG" },
    alternates: { canonical: `https://thesvg.org/docs/${guide.id}` },
  };
}

export default async function DocsGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = FRAMEWORK_GUIDES.find((g) => g.id === slug);
  if (!guide) notFound();

  const tocItems = guide.snippets.map((s) => ({ id: slugifyHeading(s.label), label: s.label }));
  const relatedQuestions = GUIDE_RELATED_FAQ[guide.id] ?? [];
  const relatedFaq = FAQ_ITEMS.filter((item) => relatedQuestions.includes(item.question));

  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{guide.label}</h1>
          {guide.packageName && (
            <Link
              href={guide.npmUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground dark:bg-white/[0.04]"
            >
              <PackageIcon className="h-2.5 w-2.5" />
              {guide.packageName}
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
          {guide.githubUrl && (
            <Link
              href={guide.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground dark:bg-white/[0.04]"
            >
              <DocsBrandIcon slug="github" className="h-2.5 w-2.5" />
              Source
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
          <DocsAskAi pageTitle={guide.label} />
        </div>
        <p className="mb-8 max-w-2xl text-sm text-muted-foreground">{guide.summary}</p>
        <div className="space-y-8">
          {guide.snippets.map((snippet) => (
            <section key={snippet.label} className="scroll-mt-24">
              <DocsHeading id={slugifyHeading(snippet.label)}>{snippet.label}</DocsHeading>
              <DocsCodeBlock snippet={snippet} />
            </section>
          ))}
        </div>

        {relatedFaq.length > 0 && (
          <div className="mt-10 border-t border-border/40 pt-6 dark:border-white/[0.06]">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Related questions
            </h2>
            <div className="space-y-3">
              {relatedFaq.map((item) => (
                <details key={item.question} className="group rounded-lg border border-border/40 px-3 py-2 dark:border-white/[0.06]">
                  <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                    {item.question}
                  </summary>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
            <Link
              href="/docs/faq"
              className="mt-3 inline-block text-xs text-orange-600 underline underline-offset-2 dark:text-orange-400"
            >
              See all FAQ &rarr;
            </Link>
          </div>
        )}

        <DocsPageFooter sourceFile="src/lib/docs-content.ts" pageTitle={guide.label} />
      </article>
      <DocsToc items={tocItems} />
    </div>
  );
}
