export interface Mention {
  title: string;
  url: string;
  source: string;
  /** ISO date (YYYY-MM-DD) the mention was added. */
  date: string;
  description: string;
  /** How thesvg is mentioned: used in code, listed in a curated list, or written about. */
  kind?: "code" | "list" | "editorial";
  /** thesvg icon slug for the mentioned project's logo. */
  logo?: string;
  /** Commit or PR that added the mention. */
  evidenceUrl?: string;
  /** The mentioned project's own site. */
  homepageUrl?: string;
  /** Shown as a larger card at the top of its group. */
  featured?: boolean;
}

export const MENTIONS: readonly Mention[] = [
  {
    title: "thesvg skill",
    url: "https://open-design.ai/skills/thesvg/",
    source: "OpenDesign",
    evidenceUrl: "https://github.com/nexu-io/open-design/pull/3516",
    homepageUrl: "https://open-design.ai",
    kind: "list",
    logo: "open-design",
    date: "2026-11-11",
    description:
      "Listed as a brand-asset retrieval skill for named brands, frameworks and cloud services (their wording: not for designing new logos or picking generic UI icons).",
  },
  {
    title: "7,600+ Brand SVG Icons for Developers",
    url: "https://www.cssscript.com/brand-svg-icons/",
    source: "CSS Script",
    homepageUrl: "https://www.cssscript.com",
    kind: "editorial",
    date: "2026-11-12",
    description:
      "A review of thesvg covering direct SVG URLs, the npm packages and the React, Vue and Svelte options.",
  },
  {
    title: "awesome-svg: Icons",
    url: "https://github.com/willianjusten/awesome-svg",
    source: "awesome-svg",
    evidenceUrl: "https://github.com/willianjusten/awesome-svg/pull/186",
    homepageUrl: "https://github.com/willianjusten/awesome-svg",
    kind: "list",
    date: "2026-11-12",
    description:
      "Listed in the curated SVG list as a library of brand logos with variants and a free API.",
  },
  {
    title: "media-use resolves brand logos from theSVG",
    url: "https://github.com/heygen-com/hyperframes",
    source: "HyperFrames",
    evidenceUrl: "https://github.com/heygen-com/hyperframes/pull/4291",
    homepageUrl: "https://hyperframes.heygen.com",
    featured: true,
    kind: "code",
    logo: "hyperframes",
    date: "2026-09-23",
    description:
      "Merged change that makes thesvg the first source for brand logos in their media-use skill, pinned to a commit and gated by license.",
  },
  {
    title: "Provider icons fallback",
    url: "https://github.com/cheaper-inference/OmniRoute",
    source: "OmniRoute",
    evidenceUrl: "https://github.com/cheaper-inference/OmniRoute/pull/6317",
    homepageUrl: "https://omniroute.online",
    kind: "code",
    logo: "omniroute",
    date: "2026-11-12",
    description:
      "Falls back to the thesvg CDN when a provider has no bundled icon.",
  },
  {
    title: "Built-in icon source",
    url: "https://github.com/lumeland/lume",
    source: "Lume",
    evidenceUrl: "https://github.com/lumeland/lume/commit/1d44d31d2c3a0b2dbb382bb5a4a2cb26831758b4",
    homepageUrl: "https://lume.land",
    featured: true,
    kind: "code",
    logo: "lume",
    date: "2026-11-12",
    description:
      "The static site generator's icons plugin ships thesvg as a built-in source, fetched through jsDelivr.",
  },
  {
    title: "Model and channel icons",
    url: "https://github.com/bestruirui/octopus",
    source: "Octopus",
    evidenceUrl: "https://github.com/bestruirui/octopus/commit/ae295af02b4e64ea379a99f9645646ec22923b51",
    homepageUrl: "https://github.com/bestruirui/octopus",
    kind: "code",
    logo: "octopus",
    date: "2026-11-12",
    description:
      "An LLM gateway whose web UI depends on the @thesvg/react package for provider icons.",
  },
  {
    title: "Editor icons in the UI package",
    url: "https://github.com/infi-pc/locatorjs",
    source: "LocatorJS",
    evidenceUrl: "https://github.com/infi-pc/locatorjs/pull/216",
    homepageUrl: "https://www.locatorjs.com",
    kind: "code",
    logo: "locatorjs",
    date: "2026-11-12",
    description:
      "Vendors the editor icons it shows from thesvg and credits the source with the MIT notice.",
  },
  {
    title: "Integration logos",
    url: "https://github.com/vellum-ai/vellum-assistant",
    source: "Vellum",
    evidenceUrl: "https://github.com/vellum-ai/vellum-assistant/pull/40460",
    homepageUrl: "https://vellum.ai",
    kind: "code",
    logo: "vellum",
    date: "2026-11-12",
    description:
      "Vendors integration logos from thesvg and lists them, with the MIT notice, in an attribution file.",
  },
  {
    title: "Third-party notices",
    url: "https://github.com/siyuan-note/siyuan",
    source: "SiYuan",
    evidenceUrl: "https://github.com/siyuan-note/siyuan/commit/057b5d0f235b3d7f2ce06822c90b60436755c2cc",
    homepageUrl: "https://b3log.org/siyuan",
    kind: "code",
    logo: "siyuan",
    date: "2026-11-12",
    description:
      "Credits thesvg in its generated third-party notices for a vendored provider logo.",
  },
  {
    title: "Agent icons",
    url: "https://github.com/delexw/claude-code-trace",
    source: "claude-code-trace",
    evidenceUrl: "https://github.com/delexw/claude-code-trace/commit/cdf251c1618b119d20147b5bef6b0179d8237cc1",
    homepageUrl: "https://github.com/delexw/claude-code-trace",
    kind: "code",
    date: "2026-11-12",
    description:
      "A Claude Code session viewer that depends on @thesvg/react for its agent icons.",
  },
  {
    title: "Listed in awesome-react",
    url: "https://github.com/enaqx/awesome-react",
    source: "awesome-react",
    evidenceUrl: "https://github.com/enaqx/awesome-react/commit/56f384961e694b18bbd66983d2b214efe3db2e9b",
    homepageUrl: "https://github.com/enaqx/awesome-react",
    kind: "list",
    date: "2026-11-12",
    description:
      "Listed in the curated React ecosystem list as a collection of free brand SVG icons.",
  },
  {
    title: "Listed in awesome-svelte",
    url: "https://github.com/TheComputerM/awesome-svelte",
    source: "awesome-svelte",
    evidenceUrl: "https://github.com/TheComputerM/awesome-svelte/pull/190",
    homepageUrl: "https://github.com/TheComputerM/awesome-svelte",
    kind: "list",
    date: "2026-04-13",
    description:
      "Listed in the curated Svelte list as @thesvg/svelte, in the Icons section.",
  },
  {
    title: "Integrations grid",
    url: "https://github.com/oceanbase/powercontext",
    source: "PowerContext",
    homepageUrl: "https://powercontext.oceanbase.io",
    kind: "code",
    logo: "oceanbase",
    date: "2026-11-12",
    description:
      "Their README integrations grid loads agent and tool logos straight from the thesvg CDN.",
  },
  {
    title: "Brand marks in UI demos",
    url: "https://github.com/neondatabase/ui",
    source: "Neon UI",
    homepageUrl: "https://ui.neon.com",
    kind: "code",
    logo: "neon",
    date: "2026-11-12",
    description:
      "Component demos load thesvg brand marks as masks and credit them in a code comment.",
  },
  {
    title: "Provider icons",
    url: "https://github.com/gitkraken/gitbench",
    source: "GitBench",
    homepageUrl: "https://gitbench.gitkraken.com",
    kind: "code",
    logo: "gitkraken",
    date: "2026-11-12",
    description:
      "Depends on @thesvg/icons and @thesvg/react for model provider icons.",
  },
];
