"use client";

import type { IconEntry } from "@/lib/icons";
import { useT } from "@/i18n/use-t";
import { computeQualityScore } from "@/lib/icon-quality-score";
import { QualityPanel } from "@/components/icons/detail/quality-panel";

export function QualityScoreCard({ icon }: { icon: IconEntry }) {
  const { t } = useT();
  const { total, breakdown } = computeQualityScore(icon);
  return (
    <QualityPanel
      title={t("icon.quality.title")}
      total={total}
      rows={breakdown}
      storageKey="thesvg-quality-panel-open"
      footnote={t("icon.quality.footnote")}
    />
  );
}
