import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/ui-icons/category-page";
import { DOMAINS, GLYPHS } from "@/lib/ui-icons/glyphs";

export const dynamicParams = false;

const usedDomains = (): typeof DOMAINS => DOMAINS.filter((d) => GLYPHS.some((g) => g.domain === d.id));

export function generateStaticParams(): { domain: string }[] {
  return usedDomains().map((d) => ({ domain: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const d = usedDomains().find((x) => x.id === domain);
  if (!d) return {};
  const count = GLYPHS.filter((g) => g.domain === d.id).length;
  return {
    title: `${d.label} UI icons (${count})`,
    description: `${count} ${d.label.toLowerCase()} UI icons in seven looks, themeable with currentColor. Copy or download the SVG, or install as a package.`,
    alternates: { canonical: `https://thesvg.org/ui/category/${d.id}` },
  };
}

export default async function UiCategoryPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  if (!usedDomains().some((d) => d.id === domain)) notFound();
  return <CategoryPage domainId={domain} />;
}
