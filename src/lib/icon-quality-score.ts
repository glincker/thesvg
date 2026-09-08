import type { IconEntry } from "@/lib/icons";

export interface QualityScoreBreakdown {
  label: string;
  score: number;
  max: number;
  hint: string;
}

export interface QualityScore {
  total: number;
  breakdown: QualityScoreBreakdown[];
}

const VAGUE_LICENSES = new Set(["", "unknown", "todo", "tbd"]);

/**
 * A data-completeness score computed entirely from fields already in
 * icons.json - no external lookups. Each dimension maps directly to a gap
 * the community can fix (missing variant, missing license clarity, missing
 * guidelines link, thin metadata), so a low score points at exactly what
 * a contributor PR should add.
 */
export function computeQualityScore(icon: IconEntry): QualityScore {
  const variantCount = Object.values(icon.variants).filter(Boolean).length;
  const variantsScore = Math.min(variantCount - 1, 4) * (25 / 4);

  const hasClearLicense = !VAGUE_LICENSES.has(icon.license?.trim().toLowerCase() ?? "");
  const licenseScore = hasClearLicense ? 25 : 0;

  const guidelinesScore = icon.guidelines ? 25 : 0;

  const metadataScore =
    (icon.url ? 10 : 0) +
    (icon.aliases.length > 0 ? 7.5 : 0) +
    (icon.categories.length >= 2 ? 7.5 : 0);

  const breakdown: QualityScoreBreakdown[] = [
    {
      label: "Variants",
      score: Math.round(variantsScore),
      max: 25,
      hint: variantCount > 1 ? `${variantCount} variants` : "Only the default variant",
    },
    {
      label: "License",
      score: licenseScore,
      max: 25,
      hint: hasClearLicense ? icon.license : "License not specified",
    },
    {
      label: "Guidelines",
      score: guidelinesScore,
      max: 25,
      hint: icon.guidelines ? "Linked" : "No guidelines link",
    },
    {
      label: "Metadata",
      score: Math.round(metadataScore),
      max: 25,
      hint: `${icon.aliases.length > 0 ? "Aliases, " : ""}${icon.categories.length} ${icon.categories.length === 1 ? "category" : "categories"}`,
    },
  ];

  const total = Math.round(breakdown.reduce((sum, b) => sum + b.score, 0));

  return { total, breakdown };
}
