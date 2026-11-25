"use client";

import { QualityPanel } from "@/components/icons/detail/quality-panel";
import type { Glyph } from "@/lib/ui-icons/glyphs";
import { useT } from "@/i18n/use-t";
import { QUALITY_LABELS, describePart } from "@/lib/ui-icons/quality";

/** Craft quality of a UI icon, scored at build time. Brand icons have their own completeness card, the two never mix. */
export function UiQualityCard({ glyph }: { glyph: Glyph }) {
  const { t } = useT();
  if (!glyph.quality) return null;
  const rows = glyph.quality.parts.map((points, i) => ({
    label: QUALITY_LABELS[i],
    score: points,
    max: 25,
    hint: describePart(i, points),
  }));
  return (
    <QualityPanel
      title={t("uikit.quality.title")}
      total={glyph.quality.score}
      rows={rows}
      storageKey="thesvg-ui-quality-panel-open"
      footnote={t("uikit.quality.footnote")}
    />
  );
}
