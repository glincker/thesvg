import { Suspense } from "react";
import { ExternalLink } from "@/components/own-icons";
import type { Metadata } from "next";
import { getCategoryCounts } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { MENTIONS } from "@/lib/mentions";

export const metadata: Metadata = {
  title: "Mentioned on - Where thesvg is listed",
  description:
    "Places on the web that list or link to thesvg, the open SVG brand library.",
  openGraph: {
    title: "Mentioned on | theSVG",
    description:
      "Places on the web that list or link to thesvg, the open SVG brand library.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/extensions/mentions" },
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export default function MentionsPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Mentioned on</h1>
            <p className="text-muted-foreground">
              Places on the web that list or link to thesvg.
            </p>
          </div>

          {/* Mentions */}
          <ul className="space-y-3">
            {MENTIONS.map((mention) => (
              <li key={mention.url}>
                <a
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-border/40 bg-card/30 p-5 transition-colors hover:border-border/70 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold">{mention.title}</h2>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {mention.source} <span aria-hidden="true">&middot;</span>{" "}
                    <time dateTime={mention.date}>{formatDate(mention.date)}</time>
                  </p>
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    {mention.description}
                  </p>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-10 max-w-2xl text-sm text-muted-foreground">
            Know a page that mentions thesvg?{" "}
            <a
              href="https://github.com/GLINCKER/thesvg/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Open an issue
            </a>{" "}
            and we will add it.
          </p>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
