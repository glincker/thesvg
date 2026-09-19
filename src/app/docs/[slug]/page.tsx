import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Package as PackageIcon } from "lucide-react";
import { FRAMEWORK_GUIDES, FAQ_ITEMS } from "@/lib/docs-content";
import { slugifyHeading } from "@/lib/docs-nav";
import { GUIDE_RELATED_FAQ } from "@/lib/docs-related-faq";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsHeading } from "@/components/docs/docs-heading";
import { DocsBrandIcon } from "@/components/docs/docs-nav-icon";
import { DocsListPage } from "@/components/docs/docs-list-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return FRAMEWORK_GUIDES.map((guide) => ({ slug: guide.id }));
}

export async function generateMetadata({ params }: Readonly<PageProps>): Promise<Metadata> {
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

function PackageBadge({ href, icon, label }: Readonly<{ href: string; icon: React.ReactNode; label: string }>) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground dark:bg-white/[0.04]"
    >
      {icon}
      {label}
      <ExternalLink className="h-2.5 w-2.5" />
    </Link>
  );
}

export default async function DocsGuidePage({ params }: Readonly<PageProps>) {
  const { slug } = await params;
  const guide = FRAMEWORK_GUIDES.find((g) => g.id === slug);
  if (!guide) notFound();

  const tocItems = guide.snippets.map((s) => ({ id: slugifyHeading(s.label), label: s.label }));
  const relatedQuestions = GUIDE_RELATED_FAQ[guide.id] ?? [];
  const relatedFaq = FAQ_ITEMS.filter((item) => relatedQuestions.includes(item.question));

  return (
    <DocsListPage
      title={guide.label}
      tocItems={tocItems}
      sourceFile="src/lib/docs-content.ts"
      titleBadges={
        <>
          {guide.packageName && (
            <PackageBadge
              href={guide.npmUrl ?? "#"}
              icon={<PackageIcon className="h-2.5 w-2.5" />}
              label={guide.packageName}
            />
          )}
          {guide.githubUrl && (
            <PackageBadge
              href={guide.githubUrl}
              icon={<DocsBrandIcon slug="github" className="h-2.5 w-2.5" />}
              label="Source"
            />
          )}
        </>
      }
      intro={<p className="mb-8 max-w-2xl text-sm text-muted-foreground">{guide.summary}</p>}
    >
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
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Related questions</h2>
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
    </DocsListPage>
  );
}
