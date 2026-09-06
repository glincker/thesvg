import { Suspense } from "react";
import { Download, FolderTree, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { getAllIcons, getCategoryCounts } from "@/lib/icons";
import { DRAWIO_LIBRARIES, getIconsForDrawioLibrary, type DrawioLibraryDef } from "@/lib/drawio-libraries";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "draw.io / diagrams.net Shape Libraries - Free Brand Icons",
  description:
    "Download free custom shape libraries of brand and dev-tool logos for draw.io / diagrams.net, grouped by category. Drop them into architecture and software diagrams alongside the built-in AWS, Azure, GCP, and Kubernetes libraries.",
  keywords: [
    "draw.io shape library",
    "diagrams.net custom shapes",
    "draw.io brand icons",
    "draw.io stencils",
    "architecture diagram icons",
    "draw.io logo library",
    "diagrams.net icon library",
  ],
  openGraph: {
    title: "draw.io / diagrams.net Shape Libraries | theSVG",
    description: `${DRAWIO_LIBRARIES.length} category-based shape libraries of brand and dev-tool icons for draw.io / diagrams.net architecture diagrams.`,
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/integrations/drawio" },
};

const IMPORT_STEPS = [
  "Open draw.io (or diagrams.net) with a diagram you're working on.",
  "At the bottom of the left-hand Shapes panel, click the grid icon labeled \"More Shapes\".",
  "In the dialog that opens, scroll down and choose \"Open Library from Device...\".",
  "Pick the downloaded .xml file for the category you want.",
  "The icons appear as a new panel in the left sidebar, ready to drag onto the canvas.",
];

function DrawioLibraryCard({ lib, count }: { lib: DrawioLibraryDef; count: number }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-all duration-200 hover:border-border/70 hover:bg-card/60 hover:shadow-xl hover:shadow-black/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04] dark:hover:shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80 text-foreground/80">
          <FolderTree className="h-5 w-5" />
        </div>
        <span className="text-[11px] text-muted-foreground">
          {count} {count === 1 ? "icon" : "icons"}
        </span>
      </div>

      <h3 className="mb-1.5 text-sm font-semibold">{lib.label}</h3>
      <p className="mb-5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {lib.label} brand and tool logos, ready to drag onto your diagram.
      </p>

      <a
        href={`/integrations/drawio/${lib.slug}.xml`}
        download
        className="group/link inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover/link:opacity-100" />
        Download .xml
      </a>
    </div>
  );
}

export default function DrawioIntegrationPage() {
  const categoryCounts = getCategoryCounts();
  const allIcons = getAllIcons();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/80">
              <img
                src="/icons/diagramsdotnet/default.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-bold sm:text-3xl">
                draw.io / diagrams.net Shape Libraries
              </h1>
              <p className="text-muted-foreground">
                Brand and dev-tool icons, ready to drop into your diagrams.
              </p>
            </div>
          </div>

          {/* Intro */}
          <p className="mb-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These are downloadable custom shape libraries built from theSVG&apos;s brand icon
            catalog, grouped by category, for use in draw.io / diagrams.net architecture and
            software diagrams. draw.io already ships built-in libraries for AWS, Azure, GCP, and
            Kubernetes, so these libraries cover the brand and developer-tool logos those
            don&apos;t include: languages, frameworks, databases, CI/CD tools, and more.
          </p>

          {/* How to import */}
          <div className="mb-12 overflow-hidden rounded-xl border border-border/40 bg-card/30 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/80 text-foreground/80">
                  <ListChecks className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">How to import a library</h2>
              </div>
              <ol className="ml-[38px] space-y-2 text-sm text-muted-foreground">
                {IMPORT_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="shrink-0 font-mono text-xs text-foreground/50">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Libraries grid */}
          <section>
            <h2 className="mb-5 text-base font-semibold">{DRAWIO_LIBRARIES.length} category libraries</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DRAWIO_LIBRARIES.map((lib) => (
                <DrawioLibraryCard
                  key={lib.slug}
                  lib={lib}
                  count={getIconsForDrawioLibrary(allIcons, lib).length}
                />
              ))}
            </div>
          </section>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
