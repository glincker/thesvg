import { Suspense } from "react";
import { Download, MousePointerClick, Shapes } from "lucide-react";
import type { Metadata } from "next";

import { getCategoryCounts } from "@/lib/icons";
import { EXCALIDRAW_LIBRARIES } from "@/lib/excalidraw-libraries";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import libraryCounts from "@/data/excalidraw-library-counts.json";

export const metadata: Metadata = {
  title: "Excalidraw Shape Libraries - Brand & Dev Tool Icons",
  description:
    "Download free .excalidrawlib shape libraries of brand and developer tool icons, grouped by category. Drop them into Excalidraw's library panel for architecture and product diagrams.",
  keywords: [
    "Excalidraw library",
    "excalidrawlib",
    "Excalidraw shape library",
    "Excalidraw icons",
    "Excalidraw brand icons",
    "Excalidraw architecture diagram icons",
    "free Excalidraw library download",
  ],
  openGraph: {
    title: "Excalidraw Shape Libraries | theSVG",
    description:
      "Free .excalidrawlib shape libraries of brand and developer tool icons, grouped by category, ready to drag onto the canvas.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/integrations/excalidraw" },
};

const IMPORT_STEPS = [
  "Open Excalidraw and expand the shape library panel on the right side of the toolbar.",
  'Click the "..." menu at the top of the library panel and choose "Open".',
  "Select the downloaded .excalidrawlib file.",
  "The icons are added to your personal library, ready to drag onto the canvas.",
];

function LibraryCard({ label, slug, count }: { label: string; slug: string; count: number }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border/40 bg-card/30 p-5 transition-all duration-200 hover:border-border/70 hover:bg-card/60 hover:shadow-xl hover:shadow-black/5 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04] dark:hover:shadow-black/40">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80 text-foreground/80">
        <Shapes className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold">{label}</h3>
      <p className="mb-5 flex-1 text-[13px] leading-relaxed text-muted-foreground">
        {count.toLocaleString("en-US")} icons
      </p>
      <a
        href={`/integrations/excalidraw/${slug}.excalidrawlib`}
        download
        className="group/link inline-flex w-fit items-center gap-1.5 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        Download
        <Download className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover/link:opacity-100" />
      </a>
    </div>
  );
}

const counts: Record<string, number> = libraryCounts;

export default function ExcalidrawIntegrationPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Excalidraw Shape Libraries</h1>
            <p className="max-w-2xl text-muted-foreground">
              Downloadable custom Excalidraw libraries of brand and developer tool icons,
              grouped by category, for architecture and product diagrams.
            </p>
          </div>

          {/* How to import */}
          <div className="mb-12 overflow-hidden rounded-xl border border-border/40 bg-card/30 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">How to import</h2>
              </div>
              <ol className="space-y-2.5 text-sm text-muted-foreground">
                {IMPORT_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/80 text-[11px] font-medium text-foreground/80">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Libraries grid */}
          <div className="mb-4">
            <h2 className="text-base font-semibold">
              {EXCALIDRAW_LIBRARIES.length} libraries
            </h2>
            <p className="text-sm text-muted-foreground">
              Each file is a self-contained .excalidrawlib you can load independently.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXCALIDRAW_LIBRARIES.map((lib) => (
              <LibraryCard
                key={lib.slug}
                label={lib.label}
                slug={lib.slug}
                count={counts[lib.slug] ?? 0}
              />
            ))}
          </div>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
