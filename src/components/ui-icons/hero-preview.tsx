import Link from "next/link";
import { DriftScene } from "@/components/drift-scene";
import { type Glyph, GLYPH_BY_SLUG, POPULAR_SLUGS, styleFor } from "@/lib/ui-icons/glyphs";
import { renderIcon, type Variant } from "@/lib/ui-icons/engine";

// One look per row, each starting at its own glyph so the rows never line up.
const ROWS: { variant: Variant; dir: "left" | "right"; speed: string }[] = [
  { variant: "outline", dir: "left", speed: "b" },
  { variant: "glass", dir: "right", speed: "d" },
  { variant: "duotone", dir: "left", speed: "a" },
  { variant: "fill", dir: "right", speed: "c" },
];
const PER_ROW = 12;

function Mark({ glyph, variant }: { glyph: Glyph; variant: Variant }) {
  const svg = renderIcon(glyph.nodes, { variant, style: styleFor(variant), size: 26, idPrefix: `hp-${variant}-${glyph.slug}` }).svg;
  return <span aria-hidden="true" className="text-foreground" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Home hero visual: the same glyphs in four looks, drifting in opposite directions. Each tile links to its icon; the repeated half is hidden from assistive tech. */
export function UiHeroPreview() {
  const glyphs = POPULAR_SLUGS.map((s) => GLYPH_BY_SLUG.get(s)).filter((g): g is Glyph => g !== undefined).slice(0, 40);
  if (glyphs.length === 0) return null;
  return (
    <DriftScene className="relative h-[19rem] w-[32rem] rotate-[8deg] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] xl:w-[38rem]">
      <div className="flex h-full flex-col justify-center gap-3">
        {ROWS.map((row, r) => {
          const items = Array.from({ length: PER_ROW }, (_, i) => glyphs[(r * 3 + i * 4) % glyphs.length]);
          return (
            <div key={row.variant} className="flags-row relative flex w-max gap-3 hover:z-20" data-dir={row.dir} data-speed={row.speed}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 gap-3" aria-hidden={copy === 1 ? true : undefined}>
                  {items.map((g, i) => (
                    <li key={`${copy}-${i}`} className="group/tile relative">
                      <Link
                        href={`/ui/${g.slug}?v=${row.variant}`}
                        prefetch={false}
                        tabIndex={-1}
                        aria-label={`${g.slug}, ${row.variant}`}
                        className="pointer-events-auto grid size-14 place-items-center rounded-2xl border border-border/40 bg-background/70 shadow-lg shadow-black/10 backdrop-blur-sm transition-transform duration-200 hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-white/10 dark:bg-white/[0.06]"
                      >
                        <Mark glyph={g} variant={row.variant} />
                      </Link>
                      <span role="tooltip" className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 -rotate-[8deg] whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-xs font-medium capitalize text-white opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 motion-reduce:transition-none">
                        {g.slug.replace(/-/g, " ")}, {row.variant}
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          );
        })}
      </div>
    </DriftScene>
  );
}
