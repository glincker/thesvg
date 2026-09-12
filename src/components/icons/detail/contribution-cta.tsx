"use client";

import { GitPullRequest, SealWarning, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { withUtm } from "@/lib/external-link";

const REPO = "glincker/thesvg";

interface ContributionCtaProps {
  slug: string;
  title: string;
  hasMultipleVariants: boolean;
  guidelinesMissing?: boolean;
}

function buildIssueUrl(
  slug: string,
  title: string,
  hasMultipleVariants: boolean,
  guidelinesMissing: boolean,
): string {
  const sections: string[] = [];
  if (guidelinesMissing) {
    sections.push(`### Official brand guidelines URL
<!-- Link to the brand's press kit / brand guidelines page -->`);
  }
  sections.push(
    hasMultipleVariants
      ? `### Which variant is missing?
<!-- e.g. mono, light, dark, wordmark -->

### SVG source
<!-- Paste SVG code or link to official brand assets -->`
      : `### What's better about the version you have?
<!-- e.g. sharper vector, official rebrand, missing details -->

### SVG source
<!-- Paste SVG code or link to official brand assets -->`,
  );

  const titleBits = [hasMultipleVariants ? "variant" : "asset", guidelinesMissing && "guidelines"]
    .filter(Boolean)
    .join(" + ");

  const params = new URLSearchParams({
    title: `[Icon Update] ${titleBits} for ${title}`,
    body: `## Icon Update Request

**Icon**: ${title} (\`${slug}\`)
**Page**: https://thesvg.org/icon/${slug}

${sections.join("\n\n")}`,
    labels: "icon-update",
  });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}

function buildPrUrl(
  slug: string,
  title: string,
  hasMultipleVariants: boolean,
  guidelinesMissing: boolean,
): string {
  const changes: string[] = [];
  const checklist: string[] = [];

  if (hasMultipleVariants) {
    changes.push(`- Added \`public/icons/${slug}/{variant}.svg\``, `- Updated \`src/data/icons.json\` with the new variant path`);
    checklist.push("- [ ] SVG has a `viewBox` attribute", "- [ ] File is under 50KB", "- [ ] No embedded scripts or raster images", "- [ ] Official brand asset (not fan-made)");
  } else {
    changes.push(`- Replaced \`public/icons/${slug}/default.svg\` with a better source`);
    checklist.push("- [ ] Official brand asset (not fan-made)", "- [ ] Ran `pnpm validate`");
  }
  if (guidelinesMissing) {
    changes.push(`- Added \`"guidelines"\` field to the ${slug} entry in \`src/data/icons.json\``);
    checklist.push("- [ ] Guidelines link points to the brand's own official page");
  }

  const titleBits = [hasMultipleVariants ? "variant" : "asset", guidelinesMissing && "guidelines"]
    .filter(Boolean)
    .join(" + ");

  const params = new URLSearchParams({
    title: `fix: add ${titleBits} for ${slug}`,
    body: `## Update ${title}

**Icon**: [\`${slug}\`](https://thesvg.org/icon/${slug})

### Changes
${changes.join("\n")}

### Checklist
${checklist.join("\n")}`,
    quick_pull: "1",
  });
  return `https://github.com/${REPO}/compare/main...main?${params.toString()}`;
}

export function ContributionCta({
  slug,
  title,
  hasMultipleVariants,
  guidelinesMissing = false,
}: ContributionCtaProps) {
  const assetLabel = hasMultipleVariants ? "a variant" : "a better version";
  const label = guidelinesMissing
    ? `Missing ${assetLabel} or a guidelines link?`
    : `Missing ${assetLabel}?`;

  return (
    <div className="group/cta relative overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 transition-colors duration-200 hover:border-orange-500/30 hover:bg-orange-500/[0.03]">
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-orange-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover/cta:opacity-100"
        aria-hidden="true"
      />
      <div className="relative mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Sparkle weight="fill" className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">Community fixes ship in the next build</p>
        </div>
      </div>
      <div className="relative flex flex-wrap gap-2">
        <a
          href={withUtm(buildIssueUrl(slug, title, hasMultipleVariants, guidelinesMissing), "contribution_cta")}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/30 hover:text-foreground hover:shadow-md active:translate-y-0 active:scale-95"
        >
          <SealWarning className="h-3.5 w-3.5 transition-transform duration-150 group-hover:rotate-12" />
          Request via Issue
        </a>
        <a
          href={withUtm(buildPrUrl(slug, title, hasMultipleVariants, guidelinesMissing), "contribution_cta")}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-1.5 overflow-hidden rounded-lg border border-orange-500/40 bg-gradient-to-b from-orange-500 to-orange-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_2px_8px_-2px_rgba(249,115,22,0.5)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_6px_16px_-2px_rgba(249,115,22,0.6)] active:translate-y-0 active:scale-95"
        >
          <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
          <GitPullRequest weight="bold" className="relative h-3.5 w-3.5 transition-transform duration-150 group-hover:-rotate-12" />
          <span className="relative">Submit a PR</span>
        </a>
      </div>
    </div>
  );
}
