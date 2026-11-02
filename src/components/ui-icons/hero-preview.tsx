import { type Glyph, GLYPH_BY_SLUG, styleFor } from "@/lib/ui-icons/glyphs";
import { renderIcon, type Variant } from "@/lib/ui-icons/engine";

const LOOKS: Variant[] = ["outline", "glass", "duotone", "fill"];
const SHOWN = ["shield-check", "rocket", "bell"];

function Mark({ glyph, variant }: { glyph: Glyph; variant: Variant }) {
  const svg = renderIcon(glyph.nodes, { variant, style: styleFor(variant), size: 30, idPrefix: `hp-${variant}-${glyph.slug}` }).svg;
  return <span aria-hidden="true" className="text-foreground" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Preview for the home hero banner: the same three glyphs in four looks, to show what the new section is. */
export function UiHeroPreview() {
  const glyphs = SHOWN.map((s) => GLYPH_BY_SLUG.get(s)).filter((g): g is Glyph => g !== undefined);
  return (
    <div className="flex items-center gap-2.5">
      {LOOKS.map((v) => (
        <div key={v} className="flex w-[82px] flex-col items-center gap-3.5 rounded-2xl border border-white/10 bg-background/60 px-2 pb-2.5 pt-4 shadow-sm dark:bg-white/[0.04]">
          {glyphs.map((g) => (
            <Mark key={g.slug} glyph={g} variant={v} />
          ))}
          <span className="text-[0.75rem] capitalize text-muted-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}
