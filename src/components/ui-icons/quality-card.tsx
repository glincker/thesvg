"use client";

import { QualityPanel } from "@/components/icons/detail/quality-panel";
import type { Glyph } from "@/lib/ui-icons/glyphs";
import { QUALITY_LABELS, describePart } from "@/lib/ui-icons/quality";

/** Craft quality of a UI icon, scored at build time. Brand icons have their own completeness card, the two never mix. */
export function UiQualityCard({ glyph }: { glyph: Glyph }) {
  if (!glyph.quality) return null;
  const rows = glyph.quality.parts.map((points, i) => ({
    label: QUALITY_LABELS[i],
    score: points,
    max: 25,
    hint: describePart(i, points),
  }));
  return (
    <QualityPanel
      title="Craft quality"
      total={glyph.quality.score}
      rows={rows}
      storageKey="thesvg-ui-quality-panel-open"
      footnote="Scored when the set is built: grid fit, clean rendering in every look, weight against the rest of the set, and complete metadata."
    />
  );
}
