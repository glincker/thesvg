import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Detail } from "@/components/ui-icons/detail";
import { GLYPHS, GLYPH_BY_SLUG } from "@/lib/ui-icons/glyphs";

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
    title: `${name} icon`,
    description: `${name} UI icon in outline, glass, duotone, offset, fill and pixel. Copy or download the SVG, themeable with currentColor.`,
  };
}

export default async function GlyphPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GLYPH_BY_SLUG.get(slug);
  if (!g) notFound();
  return <Detail glyph={g} />;
}
