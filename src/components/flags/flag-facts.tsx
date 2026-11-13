import Link from "next/link";
import { FLAGS } from "../../../packages/flags/src/data/flags.generated";
import type { FlagEntry } from "@/lib/flag-seo";

const languageName = (code: string): string => {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

const FILE = { rect: "default", square: "square", circle: "circle" } as const;

/** Visible, crawlable facts and links for one flag page: the text and internal links a search engine needs. */
export function FlagFacts({ flag }: { flag: FlagEntry }) {
  const sameRegion = FLAGS.filter((f) => f.slug !== flag.slug && f.kind === flag.kind && f.continent === flag.continent).slice(0, 18);
  const facts: [string, string][] = [
    ["Name", flag.name],
    ...(flag.official && flag.official !== flag.name ? ([["Official name", flag.official]] as [string, string][]) : []),
    ...(flag.native && flag.native !== flag.name ? ([["Native name", flag.native]] as [string, string][]) : []),
    ...(flag.iso ? ([["ISO 3166-1 alpha-2", flag.iso]] as [string, string][]) : []),
    ...(flag.alpha3 ? ([["ISO 3166-1 alpha-3", flag.alpha3]] as [string, string][]) : []),
    ...(flag.numeric ? ([["ISO numeric", flag.numeric]] as [string, string][]) : []),
    ...(flag.capital ? ([["Capital", flag.capital]] as [string, string][]) : []),
    ...(flag.continent ? ([["Region", flag.continent]] as [string, string][]) : []),
    ...(flag.languages?.length ? ([["Languages", flag.languages.map(languageName).join(", ")]] as [string, string][]) : []),
  ];
  return (
    <section aria-labelledby="flag-facts" className="mx-auto w-full max-w-5xl px-4 pb-16 pt-4 md:pl-60">
      <h2 id="flag-facts" className="text-xl font-semibold">About the {flag.name} flag</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The {flag.name} flag is available as a free SVG in three shapes: a 4x3 rectangle, a square and a circle. Use it in apps, language pickers, country selectors and docs.
      </p>

      <dl className="mt-5 grid max-w-2xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-sm font-semibold">Use it</h3>
      <pre className="mt-2 max-w-2xl overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs"><code>{`pnpm add @thesvg/flags

import { ${"Flag" + flag.code.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")} } from "@thesvg/flags/react/${flag.code}";

<${"Flag" + flag.code.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")} variant="circle" size={32} title="${flag.name}" />`}</code></pre>
      <p className="mt-2 text-xs text-muted-foreground">
        Raw files: {Object.entries(FILE).map(([shape, file], i) => (
          <span key={shape}>{i > 0 ? ", " : ""}<a className="underline" href={`/icons/${flag.slug}/${file}.svg`}>{shape}</a></span>
        ))}. <Link href="/docs/flags" className="underline">Flags guide</Link>. <Link href="/collection/flags" className="underline">All flags</Link>.
      </p>

      {sameRegion.length > 0 ? (
        <>
          <h3 className="mt-8 text-sm font-semibold">More {flag.continent ? `${flag.continent} ` : ""}flags</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {sameRegion.map((f) => (
              <li key={f.slug}>
                <Link href={`/icon/${f.slug}`} className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-xs hover:bg-muted">
                  <img src={`/icons/${f.slug}/default.svg`} alt="" width={24} height={18} loading="lazy" decoding="async" className="object-contain" />
                  <span className="truncate">{f.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
