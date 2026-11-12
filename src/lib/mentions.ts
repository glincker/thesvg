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
    title: "media-use resolves brand logos from theSVG",
    url: "https://github.com/heygen-com/hyperframes/pull/4291",
    source: "HyperFrames",
    date: "2026-09-23",
    description:
      "Merged change that makes thesvg the first source for brand logos in their media-use skill, pinned to a commit and gated by license.",
  },
  {
    title: "Provider icon fallback chain",
    url: "https://github.com/cheaper-inference/OmniRoute/pull/6317",
    source: "OmniRoute",
    date: "2026-07-10",
    description:
      "Merged change that makes the thesvg CDN the third tier of their provider icon chain, used for providers with no bundled icon.",
  },
];
