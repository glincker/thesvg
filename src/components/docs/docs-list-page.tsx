import type { ReactNode } from "react";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsToc, type DocsTocItem } from "@/components/docs/docs-toc";

interface DocsListPageProps {
  title: string;
  /** Extra badges (npm/GitHub links, etc.) rendered next to the h1. */
  titleBadges?: ReactNode;
  intro?: ReactNode;
  tocItems: DocsTocItem[];
  sourceFile: string;
  children: ReactNode;
}

/** Shared shape for docs pages that are "a title, an Ask AI button, a list
 * of anchored sections, an on-page TOC, and an edit/feedback footer" -
 * recipes, tricks, migration, and the [slug] framework guides all follow
 * this exact layout, so it lives in one place instead of four. */
export function DocsListPage({
  title,
  titleBadges,
  intro,
  tocItems,
  sourceFile,
  children,
}: Readonly<DocsListPageProps>) {
  return (
    <div className="flex gap-10">
      <article className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            {titleBadges}
          </div>
          <DocsAskAi pageTitle={title} />
        </div>
        {intro}
        {children}
        <DocsPageFooter sourceFile={sourceFile} pageTitle={title} />
      </article>
      <DocsToc items={tocItems} />
    </div>
  );
}
