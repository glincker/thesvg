import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { FamilyCard, OG_SIZE, logoUri } from "@/lib/og-card";
import {
  FAMILY_THEME,
  getFamilyFeatured,
  getFamilyMembers,
  getFamilySlugs,
} from "@/lib/families";
import { getIconBySlug } from "@/lib/icons";

export const dynamic = "force-static";
export const runtime = "nodejs";
export const alt = "Brand family logos on thesvg.org";
export const size = OG_SIZE;
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getFamilySlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const parent = getIconBySlug(slug);
  if (!parent || !getFamilySlugs().includes(slug)) notFound();

  const members = getFamilyMembers(slug);
  const featured = getFamilyFeatured(slug);
  const shown = [...featured, ...members.filter((m) => !featured.includes(m) && m.slug !== slug)];
  const logos = (await Promise.all(shown.slice(0, 7).map((m) => logoUri(m.slug)))).filter(
    (u): u is string => Boolean(u),
  );
  const theme = FAMILY_THEME[slug];

  return new ImageResponse(
    (
      <FamilyCard
        title={parent.title}
        tagline={theme?.tagline ?? `Everything ${parent.title} in one place`}
        count={members.length}
        accents={theme?.accents ?? ["#f97316", "#3b82f6"]}
        parentUri={await logoUri(slug)}
        logos={logos}
      />
    ),
    { ...OG_SIZE },
  );
}
