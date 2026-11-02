"use client";

import type { IconEntry } from "@/lib/icons";
import { computeQualityScore } from "@/lib/icon-quality-score";
import { QualityPanel } from "@/components/icons/detail/quality-panel";

export function QualityScoreCard({ icon }: { icon: IconEntry }) {
  const { total, breakdown } = computeQualityScore(icon);
  return (
    <QualityPanel
      title="Completeness"
      total={total}
      rows={breakdown}
      storageKey="thesvg-quality-panel-open"
      footnote={<>How complete this icon&apos;s assets are, not a judgment of the brand or the artwork itself. Help close the gaps via the contribution links below.</>}
    />
  );
}
