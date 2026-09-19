/**
 * Per-guide picks from the FAQ_ITEMS pool in docs-content.ts, matched by
 * exact question text. Keeps a single FAQ source of truth (docs-content.ts)
 * instead of duplicating answers per guide page.
 */
export const GUIDE_RELATED_FAQ: Record<string, string[]> = {
  cdn: [
    "My icon is showing a broken image / 404. What's wrong?",
    "Why does the same icon look different in dark mode?",
  ],
  react: [
    "Does theSVG work with Next.js's <Image> component?",
    "Is there a TypeScript type listing every icon slug?",
    "Do the framework packages support server-side rendering (SSR)?",
  ],
  vue: [
    "Do the framework packages support server-side rendering (SSR)?",
    "Which package should I actually install?",
  ],
  svelte: [
    "Do the framework packages support server-side rendering (SSR)?",
    "Which package should I actually install?",
  ],
  "react-native": [
    "Which package should I actually install?",
    "An icon is missing a dark, light, or wordmark variant. Why?",
  ],
  cli: [
    "Which package should I actually install?",
    "How do I request a new brand or report an outdated logo?",
  ],
  api: [
    "Is there a rate limit on the API?",
    "My icon is showing a broken image / 404. What's wrong?",
  ],
  mcp: ["Can AI assistants use theSVG directly?"],
};
