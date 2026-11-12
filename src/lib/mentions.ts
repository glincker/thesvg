export interface Mention {
  title: string;
  url: string;
  source: string;
  /** ISO date (YYYY-MM-DD) the mention was added. */
  date: string;
  description: string;
}

export const MENTIONS: readonly Mention[] = [
  {
    title: "thesvg skill",
    url: "https://open-design.ai/skills/thesvg/",
    source: "OpenDesign",
    date: "2026-11-11",
    description:
      "Listed as a brand-asset retrieval skill for named brands, frameworks and cloud services (their wording: not for designing new logos or picking generic UI icons).",
  },
];
