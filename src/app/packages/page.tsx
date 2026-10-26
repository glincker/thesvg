import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UiGlyph } from "@/components/ui-glyph";
import { GROUP_TITLES, PACKAGES, installCommand, npmUrl } from "@/lib/packages-list";

export const metadata: Metadata = {
  title: "Packages",
  description: "Every npm package published under theSVG: brand icons, UI icons, the CLI and the MCP server.",
};

function readPackage(dir: string): { version: string; description: string } {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "packages", dir, "package.json"), "utf8")) as { version?: string; description?: string };
    return { version: pkg.version ?? "", description: pkg.description ?? "" };
  } catch {
    return { version: "", description: "" };
  }
}

export default function PackagesPage() {
  const groups = (["brand", "ui", "tools"] as const).map((g) => ({
    id: g,
    items: PACKAGES.filter((p) => p.group === g).map((p) => ({ ...p, ...readPackage(p.dir) })),
  }));
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Packages</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Everything theSVG publishes to npm, in one place. Brand icons and UI icons are separate packages, so adding one never makes the other heavier. Every package is tree-shakeable and versions move together within each group.
      </p>
      {groups.map((g) => (
        <section key={g.id} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">{GROUP_TITLES[g.id]}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.items.map((p) => (
              <div key={p.name} className="flex flex-col gap-2 rounded-2xl border bg-card/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{p.name}</p>
                    <p className="text-[0.75rem] text-muted-foreground">{p.label}</p>
                  </div>
                  {p.version && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[0.75rem] text-muted-foreground">v{p.version}</span>}
                </div>
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <code className="min-w-0 truncate rounded-lg bg-muted/60 px-2 py-1 font-mono text-[0.75rem]">{installCommand(p.name)}</code>
                  <a href={npmUrl(p.name)} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] text-muted-foreground hover:text-foreground">
                    npm <UiGlyph name="external-link" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
