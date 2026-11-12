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
  {
    title: "7,600+ Brand SVG Icons for Developers",
    url: "https://www.cssscript.com/brand-svg-icons/",
    source: "CSS Script",
    date: "2026-11-12",
    description:
      "A review of thesvg covering direct SVG URLs, the npm packages and the React, Vue and Svelte options.",
  },
  {
    title: "awesome-svg: Icons",
    url: "https://github.com/willianjusten/awesome-svg/blob/master/topics/Icons.md",
    source: "awesome-svg",
    date: "2026-11-12",
    description:
      "Listed in the curated SVG list as a library of brand logos with variants and a free API.",
  },
  {
    title: "Logo provider in the media-use skill",
    url: "https://github.com/heygen-com/hyperframes",
    source: "HyperFrames",
    date: "2026-11-12",
    description:
      "Its media-use skill and CLI look up brand logos from thesvg, pinned to a specific commit.",
  },
  {
    title: "Provider icons fallback",
    url: "https://github.com/cheaper-inference/OmniRoute",
    source: "OmniRoute",
    date: "2026-11-12",
    description:
      "Falls back to the thesvg CDN when a provider has no bundled icon.",
  },
];
