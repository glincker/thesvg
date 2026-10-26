import type { Metadata } from "next";
import Link from "next/link";
import { Snippet } from "@/components/ui-icons/snippet";

export const metadata: Metadata = { title: "Docs", description: "Use the UI icons: install, props, looks, states, color and accessibility." };

const PROPS: [string, string, string][] = [
  ["size", "number or string", "Width and height. The icons are drawn for 16 to 48, 24 is the default."],
  ["color", "string", "Any CSS color. Defaults to currentColor, so the icon takes the text color around it."],
  ["className, style, ...", "SVG props", "Everything else is passed to the svg element, including ref."],
  ["aria-label", "string", "Gives the icon a name. Without it the icon is treated as decoration and hidden from screen readers."],
];

const LOOKS: [string, string, string][] = [
  ["Outline", "", "The everyday look. Use it for resting controls and dense UI."],
  ["Glass", "Glass", "A translucent pane. Best at 20px and larger, on a dark or colored background."],
  ["Duotone", "Duotone", "A soft second tone. Good for rest and hover states and for empty states."],
  ["Offset", "Offset", "A shifted shadow tone. A friendlier look for onboarding and marketing."],
  ["Fill", "Fill", "Solid. Use it for the active or selected state. Line-only glyphs (arrows, chevrons) get a heavier outline instead."],
  ["Pixel", "Pixel", "A grid of squares, for retro and technical interfaces."],
  ["Depth", "Depth", "An extruded body with a lit face. For large, playful uses."],
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="mt-10 scroll-mt-24 text-xl font-semibold tracking-tight">{children}</h2>;
}

export default function DocsPage() {
  return (
    <div className="mx-auto w-full max-w-[860px] pb-10">
      <h1 className="text-3xl font-bold tracking-tight">Docs</h1>
      <p className="mt-2 text-sm text-muted-foreground">Everything you need to use the UI icons in an app. Every icon page also has copy-ready code for React, Vue, Svelte, HTML and CSS.</p>

      <H id="start">Quick start</H>
      <p className="mt-2 text-sm text-muted-foreground">Install the package for your framework, or add a single icon with the CLI.</p>
      <div className="mt-3"><Snippet lang="html" code={"npm install @thesvg/ui-react"} /></div>
      <div className="mt-3">
        <Snippet code={`import { RocketIcon, RocketDuotoneIcon } from "@thesvg/ui-react"

export function Launch() {
  return <RocketDuotoneIcon size={24} aria-label="Launch" />
}`} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Packages: <code className="font-mono text-xs">@thesvg/ui-react</code>, <code className="font-mono text-xs">@thesvg/ui-vue</code>, <code className="font-mono text-xs">@thesvg/ui-svelte</code>. Raw files and the JSON manifest are in <code className="font-mono text-xs">@thesvg/ui</code>.</p>
      <div className="mt-3"><Snippet lang="html" code={"npx @thesvg/cli add ui:rocket --look glass"} /></div>

      <H id="props">Props</H>
      <div className="mt-3 overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-card/60 text-[0.75rem] uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2 font-medium">Prop</th><th className="px-4 py-2 font-medium">Type</th><th className="px-4 py-2 font-medium">What it does</th></tr>
          </thead>
          <tbody>
            {PROPS.map(([name, type, what]) => (
              <tr key={name} className="border-t align-top">
                <td className="px-4 py-2.5 font-mono text-xs text-orange-300">{name}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{type}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H id="looks">The looks and when to use them</H>
      <p className="mt-2 text-sm text-muted-foreground">Every icon has one export per look, so a look you do not import never reaches your bundle. Outline is <code className="font-mono text-xs">RocketIcon</code>, the others add the look: <code className="font-mono text-xs">RocketGlassIcon</code>, <code className="font-mono text-xs">RocketFillIcon</code>.</p>
      <dl className="mt-3 grid gap-2">
        {LOOKS.map(([name, suffix, text]) => (
          <div key={name} className="flex gap-4 rounded-xl border bg-card/50 px-4 py-3 text-sm">
            <dt className="w-24 shrink-0 font-medium">{name}<span className="mt-0.5 block font-mono text-[0.75rem] font-normal text-muted-foreground">{`Rocket${suffix}Icon`}</span></dt>
            <dd className="text-muted-foreground">{text}</dd>
          </div>
        ))}
      </dl>

      <H id="states">States</H>
      <p className="mt-2 text-sm text-muted-foreground">A simple recipe that works well: rest and hover use duotone or outline, active switches to fill. The icon page has an interactive demo of exactly this, with hover, focus, press and toggle, on dark and light surfaces.</p>
      <div className="mt-3">
        <Snippet code={`<button className="group" data-on={on}>
  <span className="group-data-[on=true]:hidden"><BellDuotoneIcon /></span>
  <span className="hidden group-data-[on=true]:inline"><BellFillIcon /></span>
</button>`} />
      </div>

      <H id="color">Color and theming</H>
      <p className="mt-2 text-sm text-muted-foreground">Icons draw with currentColor. Set the text color on a parent and the icon follows, in light and dark. Pass <code className="rounded bg-muted px-1 font-mono text-xs">color</code> to override it for one icon. To flip an icon for right to left layouts, use a CSS transform such as <code className="rounded bg-muted px-1 font-mono text-xs">scale-x-[-1]</code>.</p>
      <div className="mt-3"><Snippet code={`<span className="text-amber-400"><StarFillIcon /></span>
<StarGlassIcon color="#f5c542" />`} /></div>

      <H id="size">Sizes</H>
      <p className="mt-2 text-sm text-muted-foreground">The icons are drawn on a 24 by 24 grid for 16 to 48 pixels. Below 16 detail gets crowded, above 48 every stroke shows, so use bigger sizes for illustration only. Glass and depth are best at 20 and above.</p>

      <H id="a11y">Accessibility</H>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>An icon next to a text label is decoration. Leave off <code className="font-mono text-xs">aria-label</code> and it is hidden from screen readers.</li>
        <li>An icon button with no text needs an <code className="font-mono text-xs">aria-label</code> on the button.</li>
        <li>Never rely on color alone for status. The fill look and the shape carry the meaning too.</li>
        <li>Keep a visible focus ring on icon buttons, and a hit area of at least 36 by 36.</li>
      </ul>

      <H id="drops">How the set grows</H>
      <p className="mt-2 text-sm text-muted-foreground">The set is released in small drops. <Link href="/ui/changelog" className="text-orange-400 underline-offset-2 hover:underline">What is new</Link> lists every drop with the real count.</p>
    </div>
  );
}
