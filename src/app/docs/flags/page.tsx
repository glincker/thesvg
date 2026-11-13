import type { Metadata } from "next";
import { DocsPageFooter } from "@/components/docs/docs-page-footer";
import { DocsAskAi } from "@/components/docs/docs-ask-ai";
import { getCollectionCount } from "@/lib/icons";
import { FlagsBrowser } from "@/components/flags/flags-browser";
import { getFlagTiles } from "@/lib/flags-tiles";

export const metadata: Metadata = {
  title: "Flags",
  description: "Country and region flags as SVG and React components: naming, shapes, sizes, accessibility and locale mapping.",
  openGraph: { title: "Flags - theSVG Docs", description: "Country and region flags in 4x3, square and circle.", siteName: "theSVG" },
  alternates: { canonical: "https://thesvg.org/docs/flags" },
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Naming",
    body: "Slugs are flag- plus the lowercase ISO 3166-1 alpha-2 code (flag-us, flag-de) or the regional code (flag-gb-eng, flag-es-ct, flag-eu, flag-un). Variants: default is the 4x3 rectangle, square is 1x1, and circle. The category is Flags.",
  },
  {
    title: "Search",
    body: "Flags are found by English and native names, official names, ISO alpha-2, alpha-3 and numeric codes, emoji, former names and locale tags. Try deutschland, DEU, 276, holland, england, catalunya or pt-BR.",
  },
  {
    title: "Choosing a shape",
    body: "Use 4x3 where true proportions help, square for fixed square slots, and circle for compact pickers and chips. Circle crops the edges of wide flags, so keep the name in text beside it.",
  },
  {
    title: "Accessibility",
    body: "Decorative flags are aria-hidden and the visible text carries the meaning. Provide a title only when the flag stands alone, which renders role=img with an accessible name.",
  },
  {
    title: "A flag is a country, not a language",
    body: "Show the native language name beside the flag and do not use flags as the only language selector. getFlagForLocale maps a locale to a conventional flag for decoration.",
  },
  {
    title: "Legal",
    body: "A flag is a public symbol of a state or organization. Including one is not a statement about sovereignty or borders. See the legal notice and disclaimer.",
  },
];

const REACT_EXAMPLE = `import { FlagUs } from "@thesvg/flags/react/us";
import { getFlagForLocale } from "@thesvg/flags/locale";

<FlagUs variant="circle" size={32} />
<FlagUs title="United States" />   // standalone: role="img"
getFlagForLocale("pt-BR");          // { slug: "flag-br", code: "br", name: "Brazil" }`;

export default function FlagsDocsPage() {
  const count = getCollectionCount("flags");
  return (
    <article className="max-w-3xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Flags</h1>
        <DocsAskAi pageTitle="Flags" />
      </div>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        {count} country and region flags in three shapes. Install with <code>npm i @thesvg/flags</code>.
      </p>
      <pre className="mb-8 overflow-x-auto rounded-xl border border-border/40 bg-card/30 p-4 text-xs dark:border-white/[0.06] dark:bg-white/[0.02]">
        <code>{REACT_EXAMPLE}</code>
      </pre>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border/40 bg-card/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <h2 className="mb-1.5 text-sm font-semibold">{item.title}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
      <section aria-labelledby="flags-browse" className="mt-10">
        <h2 id="flags-browse" className="mb-3 text-lg font-semibold">Try it</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Filter by region, color or locale, switch shape and size, and open a flag for copy-paste snippets. Your choices stay in this browser only. Arrow keys move between flags, Enter opens details, S stars one.
        </p>
        <FlagsBrowser tiles={getFlagTiles()} syncUrl={false} />
      </section>
      <section aria-labelledby="flags-credits" className="mt-10">
        <h2 id="flags-credits" className="mb-2 text-lg font-semibold">Credits and licenses</h2>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The flag drawings come from flag-icons (4x3 and square) and circle-flags (circle), both MIT licensed. The files themselves carry no credit text; the full notices and the per-file source map are in THIRD_PARTY_NOTICES.md and packages/flags/src/data/licenses.json in the repository. A flag is a public symbol of a state or organization, and including one is not a statement about sovereignty.
        </p>
      </section>
      <p className="mt-6 text-xs text-muted-foreground">
        Full guide with props, locale table, Vue, Svelte and plain SVG examples:{" "}
        <a className="underline" href="https://github.com/glincker/thesvg/blob/main/docs/flags.md">docs/flags.md</a>.
      </p>
      <DocsPageFooter sourceFile="docs/flags.md" pageTitle="Flags" />
    </article>
  );
}
