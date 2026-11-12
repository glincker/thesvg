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
  {
    title: "Built-in icon source",
    url: "https://github.com/lumeland/lume/blob/main/packages/plugin-icons/deps/icons.ts",
    source: "Lume",
    date: "2026-11-12",
    description:
      "The static site generator's icons plugin ships thesvg as a built-in source, fetched through jsDelivr.",
  },
  {
    title: "Model and channel icons",
    url: "https://github.com/bestruirui/octopus/blob/master/web/package.json",
    source: "Octopus",
    date: "2026-11-12",
    description:
      "An LLM gateway whose web UI depends on the @thesvg/react package for provider icons.",
  },
  {
    title: "Editor icons in the UI package",
    url: "https://github.com/infi-pc/locatorjs/blob/master/packages/ui/ICON-LICENSES.md",
    source: "LocatorJS",
    date: "2026-11-12",
    description:
      "Vendors the editor icons it shows from thesvg and credits the source with the MIT notice.",
  },
  {
    title: "Integration logos",
    url: "https://github.com/vellum-ai/vellum-assistant/blob/main/clients/web/public/images/integrations/ATTRIBUTION.md",
    source: "Vellum",
    date: "2026-11-12",
    description:
      "Vendors integration logos from thesvg and lists them, with the MIT notice, in an attribution file.",
  },
  {
    title: "Third-party notices",
    url: "https://github.com/siyuan-note/siyuan/blob/master/scripts/generate-third-party-notices.py",
    source: "SiYuan",
    date: "2026-11-12",
    description:
      "Credits thesvg in its generated third-party notices for a vendored provider logo.",
  },
  {
    title: "Agent icons",
    url: "https://github.com/delexw/claude-code-trace/blob/main/package.json",
    source: "claude-code-trace",
    date: "2026-11-12",
    description:
      "A Claude Code session viewer that depends on @thesvg/react for its agent icons.",
  },
  {
    title: "Listed in awesome-react",
    url: "https://github.com/enaqx/awesome-react",
    source: "awesome-react",
    date: "2026-11-12",
    description:
      "Listed in the curated React ecosystem list as a collection of free brand SVG icons.",
  },
  {
    title: "Listed in awesome-svelte",
    url: "https://github.com/TheComputerM/awesome-svelte",
    source: "awesome-svelte",
    date: "2026-04-13",
    description:
      "Listed in the curated Svelte list as @thesvg/svelte, in the Icons section.",
  },
];
