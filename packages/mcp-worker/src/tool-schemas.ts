// Shared input-schema pieces for tools that take a slug + variant pair
// (get_icon and get_icon_url both do). Extracted because the two tools'
// schemas were otherwise near-identical blocks of zod boilerplate that
// SonarCloud's duplication check (rightly) flagged.

import { z } from "zod";

export const SLUG_DESCRIPTION =
  "Icon slug identifier (e.g. 'github', 'stripe', 'openai'). Use search_icons to find slugs.";

/** Builds the { slug, variant } input schema shared by get_icon and get_icon_url. */
export function slugAndVariantSchema(variantDescription: string) {
  return z.object({
    slug: z.string().describe(SLUG_DESCRIPTION),
    variant: z
      .string()
      .optional()
      .default("default")
      .describe(variantDescription),
  });
}
