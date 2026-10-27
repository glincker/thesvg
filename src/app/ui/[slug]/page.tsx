import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Detail } from "@/components/ui-icons/detail";
import { GLYPHS, GLYPH_BY_SLUG, VARIANTS } from "@/lib/ui-icons/glyphs";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return GLYPHS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GLYPH_BY_SLUG.get(slug);
  if (!g) return {};
  const name = slug.replace(/-/g, " ");
  return {
    title: `${name} UI icon`,
    description: `${name} UI icon in ${VARIANTS.slice(0, -1).join(", ")} and ${VARIANTS.at(-1)}. Copy or download the SVG, themeable with currentColor.`,
  };
}

export default async function GlyphPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GLYPH_BY_SLUG.get(slug);
  if (!g) notFound();
  return <Detail glyph={g} />;
}
