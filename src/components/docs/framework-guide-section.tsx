import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { FrameworkGuide } from "@/lib/docs-content";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";

export function FrameworkGuideSection({ guide }: { guide: FrameworkGuide }) {
  return (
    <section id={guide.id} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{guide.label}</h3>
        {guide.packageName && (
          <Link
            href={guide.npmUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground dark:bg-white/[0.04]"
          >
            {guide.packageName}
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{guide.summary}</p>
      <div className="space-y-3">
        {guide.snippets.map((snippet) => (
          <DocsCodeBlock key={snippet.label} snippet={snippet} />
        ))}
      </div>
    </section>
  );
}
