import { getAllIcons, getIconBySlug } from "@/lib/icons";
import type { IconEntry } from "@/lib/icons";

/**
 * Brand families group icons by owner (Amazon, Google, ...). A family is a
 * parent brand icon plus every icon whose `family` field points at it.
 * Families are orthogonal to categories: a category says what a product
 * does, a family says who it belongs to.
 */

/** A parent needs at least this many members to get a family page. */
export const FAMILY_MIN_MEMBERS = 4;

export interface FamilySummary {
  slug: string;
  title: string;
  /** Members including the parent icon itself. */
  count: number;
  logo: string;
}

let index: Map<string, IconEntry[]> | null = null;

function getIndex(): Map<string, IconEntry[]> {
  if (index) return index;
  const map = new Map<string, IconEntry[]>();
  for (const icon of getAllIcons()) {
    if (!icon.family) continue;
    const list = map.get(icon.family) ?? [];
    list.push(icon);
    map.set(icon.family, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  index = map;
  return map;
}

/** Child icons of a family (the parent itself is not included). */
export function getFamilyChildren(parentSlug: string): IconEntry[] {
  return getIndex().get(parentSlug) ?? [];
}

/** Parent icon first, then members alphabetically. */
export function getFamilyMembers(parentSlug: string): IconEntry[] {
  const parent = getIconBySlug(parentSlug);
  const children = getFamilyChildren(parentSlug);
  return parent ? [parent, ...children] : children;
}

export function getFamilySlugs(): string[] {
  return getFamilySummaries().map((f) => f.slug);
}

export function getFamilySummaries(): FamilySummary[] {
  const out: FamilySummary[] = [];
  for (const [slug, children] of getIndex()) {
    const parent = getIconBySlug(slug);
    if (!parent) continue;
    if (children.length + 1 < FAMILY_MIN_MEMBERS) continue;
    out.push({
      slug,
      title: parent.title,
      count: children.length + 1,
      logo: parent.variants.default,
    });
  }
  return out.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
}

/**
 * The family an icon belongs to, as the parent slug, or null when it has
 * none (or its family is too small to have a page).
 */
export function getFamilySlugFor(icon: IconEntry): string | null {
  const slug = icon.family ?? icon.slug;
  const children = getFamilyChildren(slug);
  if (children.length + 1 < FAMILY_MIN_MEMBERS) return null;
  return getIconBySlug(slug) ? slug : null;
}

/** How many siblings the icon page needs; the full list lives on the family page. */
const SIBLINGS_SHOWN = 6;

/**
 * Siblings for the "More from <family>" strip: same primary category
 * first, then the rest, never the icon itself. Keeps the page payload to a
 * handful of icons even for a 100+ member family.
 */
export function pickFamilySiblings(
  members: IconEntry[],
  icon: IconEntry,
): IconEntry[] {
  const others = members.filter((m) => m.slug !== icon.slug);
  const primary = icon.categories[0];
  const same = others.filter((m) => m.categories[0] === primary);
  const rest = others.filter((m) => m.categories[0] !== primary);
  return [...same, ...rest].slice(0, SIBLINGS_SHOWN);
}

export interface FamilySectionRule {
  title: string;
  /** Matched against the icon slug. First matching rule wins. */
  match: RegExp;
}

/**
 * Product-area groups for large families, where category names are too
 * generic to group by (most Google icons are simply "Google"). Families
 * without an entry fall back to category sections. Anything unmatched
 * lands in a final catch-all, so a new icon never disappears.
 */
export const FAMILY_SECTION_RULES: Record<string, FamilySectionRule[]> = {
  google: [
    {
      title: "Workspace",
      match: /gmail|drive|docs|sheets|slides|forms|calendar|meet|chat|keep|sites|tasks|contacts|jamboard|classroom|workspace|vids/,
    },
    {
      title: "AI",
      match: /gemini|bard|notebooklm|veo|imagen|nano|antigravity|gemma|ai-studio|deepmind|genkit|jules|duet|labs/,
    },
    {
      title: "Cloud and developers",
      match: /cloud|gcp|firebase|firestore|bigquery|looker|vertex|colab|kaggle|flutter|dart|^go$|angular|tensorflow|apps-script|dialogflow|apigee|chrome-web-store|android-studio|pagespeed|lighthouse|material|polymer|bazel/,
    },
    {
      title: "Ads and analytics",
      match: /ads|adsense|admob|analytics|tag-manager|search-console|optimize|data-studio|merchant|my-business|campaign/,
    },
    {
      title: "Android and devices",
      match: /android|pixel|nest|fitbit|wear|chromecast|chrome-os|assistant|home|stadia|auto|tv/,
    },
    {
      title: "Apps and services",
      match: /maps|earth|photos|youtube|play|translate|lens|podcasts|music|news|arts|books|pay|wallet|chrome|search|voice|duo|trends|scholar|blogger|waze|fi$|google$/,
    },
  ],
};

/** Families at least this large use curated groups when rules exist. */
export const FAMILY_GROUPING_MIN = 30;
