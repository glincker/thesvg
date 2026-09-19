/**
 * Concrete build patterns for /docs, each targeting a specific real-world
 * use case. Same ground rules as docs-content.ts: only APIs that actually
 * exist in the packages or in standard framework/browser behavior, nothing
 * invented.
 */

import type { DocsSnippet } from "@/lib/docs-content";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  snippets: DocsSnippet[];
}

export const RECIPES: Recipe[] = [
  {
    id: "tech-stack-badges",
    title: "A \"built with\" tech-stack badge row",
    description:
      "The most common use case: a row of logos on a landing page or README saying what a product is built with. Plain CDN <img> tags, no install.",
    snippets: [
      {
        label: "HTML / JSX",
        format: "html",
        code: `<div class="flex items-center gap-3">\n  <img src="https://thesvg.org/icons/nextdotjs/default.svg" width="28" alt="Next.js" />\n  <img src="https://thesvg.org/icons/typescript/default.svg" width="28" alt="TypeScript" />\n  <img src="https://thesvg.org/icons/tailwindcss/default.svg" width="28" alt="Tailwind CSS" />\n  <img src="https://thesvg.org/icons/vercel/default.svg" width="28" alt="Vercel" />\n</div>`,
      },
      {
        label: "Markdown (README)",
        code: `![Next.js](https://thesvg.org/icons/nextdotjs/default.svg) ![TypeScript](https://thesvg.org/icons/typescript/default.svg) ![Tailwind CSS](https://thesvg.org/icons/tailwindcss/default.svg)`,
      },
    ],
  },
  {
    id: "icon-picker",
    title: "A searchable icon picker combobox",
    description:
      "Fetch the manifest once on mount, filter client-side per keystroke, render matches with the CDN URL. No search library, no per-keystroke request.",
    snippets: [
      {
        label: "React",
        format: "react",
        code: `function IconPicker({ onSelect }: { onSelect: (slug: string) => void }) {\n  const [icons, setIcons] = useState<{ slug: string; title: string }[]>([]);\n  const [query, setQuery] = useState("");\n\n  useEffect(() => {\n    fetch('https://thesvg.org/api/registry.json')\n      .then((r) => r.json())\n      .then((data) => setIcons(data.icons));\n  }, []);\n\n  const matches = icons\n    .filter((icon) => icon.title.toLowerCase().includes(query.toLowerCase()))\n    .slice(0, 20);\n\n  return (\n    <div>\n      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search icons..." />\n      <div className="grid grid-cols-6 gap-2">\n        {matches.map((icon) => (\n          <button key={icon.slug} onClick={() => onSelect(icon.slug)}>\n            <img src={\`https://thesvg.org/icons/\${icon.slug}/default.svg\`} width={24} alt={icon.title} />\n          </button>\n        ))}\n      </div>\n    </div>\n  );\n}`,
      },
    ],
  },
  {
    id: "nextjs-image",
    title: "Using icons with Next.js's <Image> component",
    description:
      "Next's built-in image optimizer doesn't rasterize SVGs by default. Either opt an image out of optimization, or allow SVGs for the icon domain - a plain <img> tag is simpler for most icon use cases and skips this entirely.",
    snippets: [
      {
        label: "Option A: skip optimization for this image",
        format: "react",
        code: `import Image from 'next/image';\n\n<Image\n  src="https://thesvg.org/icons/github/default.svg"\n  width={24}\n  height={24}\n  alt="GitHub"\n  unoptimized\n/>`,
      },
      {
        label: "Option B: allow SVGs from the icon domain",
        code: `// next.config.ts\nexport default {\n  images: {\n    remotePatterns: [{ hostname: "thesvg.org" }],\n    dangerouslyAllowSVG: true,\n  },\n};`,
      },
    ],
  },
  {
    id: "accessible-icon-button",
    title: "An accessible icon-only button",
    description:
      "An icon with no visible label needs an accessible name some other way - aria-label plus role, or visually-hidden text so screen readers announce it correctly.",
    snippets: [
      {
        label: "React",
        format: "react",
        code: `import { Github } from '@thesvg/react';\n\nfunction IconButton() {\n  return (\n    <button aria-label="View source on GitHub">\n      <Github width={20} height={20} aria-hidden="true" />\n    </button>\n  );\n}`,
      },
    ],
  },
  {
    id: "logo-strip-fallback",
    title: "An integrations/partners logo strip with fallback",
    description:
      "A directory of user-connected or third-party integrations where a slug might not exist in the catalog (typo, renamed brand, not yet added). Fall back instead of showing a broken image.",
    snippets: [
      {
        label: "React",
        format: "react",
        code: `// "/generic-integration.svg" is a placeholder you provide from your own\n// public/ folder.\nfunction IntegrationLogo({ slug, name }: { slug: string; name: string }) {\n  return (\n    <img\n      src={\`https://thesvg.org/icons/\${slug}/default.svg\`}\n      onError={(e) => {\n        e.currentTarget.onerror = null; // stop if the fallback itself 404s\n        e.currentTarget.src = "/generic-integration.svg";\n      }}\n      width={32}\n      height={32}\n      alt={name}\n    />\n  );\n}`,
      },
    ],
  },
  {
    id: "cli-in-ci",
    title: "Vendoring icons at CI/build time instead of runtime",
    description:
      "For air-gapped builds or when you want icons checked into a build artifact rather than fetched at request time, run the CLI as a build step.",
    snippets: [
      {
        label: "package.json script",
        code: `{\n  "scripts": {\n    "prebuild": "thesvg add github vercel nextjs --dir ./public/icons"\n  }\n}`,
      },
      {
        label: "Dockerfile",
        format: "cli",
        code: `RUN npx --yes @thesvg/cli add github vercel nextjs --dir /app/public/icons`,
      },
    ],
  },
];
