import { Suspense } from "react";
import { Network } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryCounts } from "@/lib/icons";
import { SidebarShell } from "@/components/layout/sidebar-shell";

export const metadata: Metadata = {
  title: "Mermaid Brand Icons - Architecture Diagrams with Real Logos",
  description:
    "Use thousands of brand and dev-tool logos in Mermaid architecture diagrams. Register the thesvg Iconify packs and reference any icon by name.",
  keywords: [
    "Mermaid icons",
    "Mermaid architecture diagram icons",
    "Mermaid registerIconPacks",
    "Mermaid brand logos",
    "Iconify Mermaid",
    "architecture-beta icons",
  ],
  openGraph: {
    title: "Mermaid Brand Icons | theSVG",
    description:
      "Register the thesvg Iconify packs in Mermaid and use brand logos in architecture diagrams.",
    siteName: "theSVG",
  },
  alternates: { canonical: "https://thesvg.org/integrations/mermaid" },
};

const REGISTER_SNIPPET = `import mermaid from "mermaid";

mermaid.registerIconPacks([
  {
    name: "thesvg",
    loader: () =>
      fetch("https://unpkg.com/@iconify-json/thesvg/icons.json").then((res) => res.json()),
  },
  {
    name: "thesvg-color",
    loader: () =>
      fetch("https://unpkg.com/@iconify-json/thesvg-color/icons.json").then((res) => res.json()),
  },
]);`;

const DIAGRAM_SNIPPET = `architecture-beta
    group cloud(cloud)[Production]

    service web(thesvg-color:nextdotjs)[Web] in cloud
    service db(thesvg-color:postgresql)[Database] in cloud
    service cache(thesvg-color:redis)[Cache] in cloud

    web:R --> L:db
    web:B --> T:cache`;

const PACKS = [
  {
    prefix: "thesvg",
    npm: "@iconify-json/thesvg",
    description: "Monochrome icons that follow currentColor. Best for themed diagrams.",
  },
  {
    prefix: "thesvg-color",
    npm: "@iconify-json/thesvg-color",
    description: "Full-color brand icons. Best when logos should keep their brand colors.",
  },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border/40 bg-muted/40 p-4 font-mono text-xs leading-relaxed dark:border-white/[0.06]">
      <code>{code}</code>
    </pre>
  );
}

export default function MermaidIntegrationPage() {
  const categoryCounts = getCategoryCounts();

  return (
    <Suspense>
      <SidebarShell categoryCounts={categoryCounts}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/80">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h1 className="mb-1 text-2xl font-bold sm:text-3xl">Mermaid Brand Icons</h1>
              <p className="text-muted-foreground">
                Real logos in your architecture diagrams, no image hosting needed.
              </p>
            </div>
          </div>

          <p className="mb-10 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Mermaid&apos;s <code>architecture-beta</code> diagrams can load Iconify icon packs.
            theSVG is published as two packs, so any brand icon in the library can be used by
            name. Find an icon on the site and use its slug after the pack prefix.
          </p>

          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold">Icon packs</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PACKS.map((pack) => (
                <div
                  key={pack.prefix}
                  className="rounded-xl border border-border/40 bg-card/30 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <h3 className="mb-1 font-mono text-sm font-semibold">{pack.prefix}</h3>
                  <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                    {pack.description}
                  </p>
                  <code className="text-xs text-foreground/70">npm i {pack.npm}</code>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold">1. Register the packs</h2>
            <CodeBlock code={REGISTER_SNIPPET} />
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-base font-semibold">2. Use icons in a diagram</h2>
            <CodeBlock code={DIAGRAM_SNIPPET} />
          </section>

          <p className="text-sm text-muted-foreground">
            Icon names match the slugs on theSVG. Search the{" "}
            <Link href="/" className="underline underline-offset-4 hover:text-foreground">
              library
            </Link>{" "}
            to find the one you need.
          </p>
        </div>
      </SidebarShell>
    </Suspense>
  );
}
