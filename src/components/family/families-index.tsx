import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import type { OtherFamily } from "@/lib/families";

export interface FamilyIndexItem extends OtherFamily {
  tagline: string;
}

function accentStyle(a: string, b: string): CSSProperties {
  return { "--fam-a": a, "--fam-b": b } as CSSProperties;
}

/** Grid of every brand family, each tinted with its own accent colors. */
export function FamiliesIndex({ families }: { families: FamilyIndexItem[] }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Brand families
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Every product from the brands you build with
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Official logos grouped by owner: the whole Amazon, Google or Microsoft
          line in one place, with every variant. {families.length} families.
        </p>
      </header>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((f) => (
          <li key={f.slug} style={accentStyle(f.accents[0], f.accents[1])}>
            <Link
              href={`/family/${f.slug}`}
              className="group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_110%_at_0%_0%,color-mix(in_oklch,var(--fam-a)_18%,transparent),transparent_70%),radial-gradient(60%_100%_at_100%_100%,color-mix(in_oklch,var(--fam-b)_14%,transparent),transparent_70%)]"
              />
              <span className="relative flex items-center">
                {f.logos.map((src, i) => (
                  <span
                    key={src}
                    className="-ml-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-background p-2.5 shadow-sm first:ml-0"
                    style={{ zIndex: f.logos.length - i }}
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </span>
                ))}
              </span>
              <span className="relative flex items-end justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold">{f.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{f.tagline}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {f.count} logos
                  <ArrowUpRight className="h-3 w-3 opacity-60" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
