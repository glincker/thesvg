import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { BrowseSuspense } from "@/components/skeletons";
import {
  FAMILY_COLLECTION_ICON,
  getFamilyFeatured,
  FAMILY_THEME,
  FAMILY_GROUPING_MIN,
  FAMILY_SECTION_RULES,
  getFamilyMembers,
  getFamilySlugs,
  getOtherFamilies,
} from "@/lib/families";
import { getCategoryCounts, getCollectionCount, getIconBySlug } from "@/lib/icons";
import type { Collection, IconEntry } from "@/lib/icons";
import { getJsDelivrUrl } from "@/components/icons/shared/icon-constants";
import { FamilyView } from "@/components/family/family-view";
import type { FamilySection } from "@/components/family/family-view";

export const dynamic = "force-static";
export const dynamicParams = false;

/** Architecture collections that belong with a family, shown as one link. */
const FAMILY_COLLECTIONS: Record<string, { collection: Collection; label: string }> = {
  amazon: { collection: "aws", label: "AWS architecture icons" },
  google: { collection: "gcp", label: "Google Cloud architecture icons" },
  microsoft: { collection: "azure", label: "Azure architecture icons" },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getFamilySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) return {};
  const count = getFamilyMembers(slug).length;
  const title = `${parent.title} family SVG logos (${count} icons)`;
  const description = `All ${parent.title} brand marks in one place: ${count} official SVG logos and variants. Copy as SVG, JSX, React or a CDN link.`;
  return {
    title,
    description,
    alternates: { canonical: `https://thesvg.org/family/${slug}` },
    openGraph: {
      title: `${title} | theSVG`,
      description,
      url: `https://thesvg.org/family/${slug}`,
      type: "website",
      siteName: "theSVG",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** A category earns its own section only with at least this many icons. */
const MIN_SECTION_SIZE = 5;

/**
 * Splits members into sections. Small families render as one continuous
 * grid; large ones get a section per sizeable category, with the leftovers
 * gathered into a final catch-all so no section is a sparse row.
 */
function buildSections(
  icons: IconEntry[],
  familyTitle: string,
  familySlug: string,
): FamilySection[] {
  const rules = FAMILY_SECTION_RULES[familySlug];
  if (rules && icons.length >= FAMILY_GROUPING_MIN) {
    const buckets = rules.map<FamilySection>((r) => ({
      title: r.title,
      category: null,
      icons: [],
    }));
    const rest: IconEntry[] = [];
    for (const icon of icons) {
      const idx = rules.findIndex((r) => r.match.test(icon.slug));
      if (idx === -1) rest.push(icon);
      else buckets[idx].icons.push(icon);
    }
    const out = buckets.filter((b) => b.icons.length > 0);
    if (rest.length > 0) {
      out.push({ title: `More from ${familyTitle}`, category: null, icons: rest });
    }
    return out;
  }
  if (icons.length < MIN_SECTION_SIZE * 3) {
    return [{ title: `All ${familyTitle} logos`, category: null, icons }];
  }
  const groups = new Map<string, IconEntry[]>();
  for (const icon of icons) {
    const key = icon.categories[0] ?? "Other";
    const list = groups.get(key) ?? [];
    list.push(icon);
    groups.set(key, list);
  }
  const big: FamilySection[] = [];
  const rest: IconEntry[] = [];
  for (const [category, list] of groups) {
    if (list.length >= MIN_SECTION_SIZE) {
      big.push({ title: category, category, icons: list });
    } else {
      rest.push(...list);
    }
  }
  big.sort((a, b) => b.icons.length - a.icons.length || a.title.localeCompare(b.title));
  if (rest.length > 0) {
    rest.sort((a, b) => a.title.localeCompare(b.title));
    big.push({ title: `More from ${familyTitle}`, category: null, icons: rest });
  }
  return big;
}

export default async function FamilyPage({ params }: PageProps) {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) notFound();

  const members = getFamilyMembers(slug);
  const children = members.filter((m) => m.slug !== slug);
  const sections = buildSections(children, parent.title, slug);

  // ⚡ Bolt: Use a single-pass loop instead of `new Set(array.map(...))` to
  // avoid allocating intermediate arrays and reduce garbage collection pressure.
  const uniqueCategories = new Set<string>();
  for (const c of children) {
    uniqueCategories.add(c.categories[0]);
  }
  const categoryCount = uniqueCategories.size;

  const extra = FAMILY_COLLECTIONS[slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${parent.title} family SVG logos`,
    url: `https://thesvg.org/family/${slug}`,
    isPartOf: { "@type": "WebSite", name: "theSVG", url: "https://thesvg.org" },
    about: { "@type": "Organization", name: parent.title, url: parent.url },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://thesvg.org" },
        { "@type": "ListItem", position: 2, name: "Brand families", item: "https://thesvg.org/families" },
        { "@type": "ListItem", position: 3, name: parent.title, item: `https://thesvg.org/family/${slug}` },
      ],
    },
    numberOfItems: members.length,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: members.slice(0, 50).map((icon, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: icon.title,
        url: `https://thesvg.org/icon/${icon.slug}`,
        image: getJsDelivrUrl(icon.slug, "default"),
      })),
    },
  };

  const theme = FAMILY_THEME[slug];
  const collectionIcon = FAMILY_COLLECTION_ICON[slug];
  // The parent brand leads its own family: first in the showcase and first
  // among the flagship tiles.
  const featured = [parent, ...getFamilyFeatured(slug)];
  const variantCount = members.reduce(
    (n, m) => n + Object.values(m.variants).filter(Boolean).length,
    0,
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <BrowseSuspense>
        <SidebarShell categoryCounts={getCategoryCounts()}>
          <FamilyView
            parent={parent}
            tagline={theme?.tagline ?? `Everything ${parent.title} in one place`}
            accents={theme?.accents ?? ["#f97316", "#a1a1aa"]}
            showcase={featured}
            featured={featured}
            sections={sections}
            total={members.length}
            categoryCount={categoryCount}
            variantCount={variantCount}
            extra={
              extra
                ? {
                    href: `/collection/${extra.collection}`,
                    label: `${extra.label} (${getCollectionCount(extra.collection)})`,
                    icon: collectionIcon ? getIconBySlug(collectionIcon)?.variants.default ?? null : null,
                  }
                : null
            }
            others={getOtherFamilies(slug)}
          />
        </SidebarShell>
      </BrowseSuspense>
    </>
  );
}
