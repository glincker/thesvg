import { test } from "node:test";
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { RawIcon } from "./codegen.ts";
import { primarySvg, readIconSvg, resolveSvgs, type SvgReader } from "./variants.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

/** A reader over an in-memory file tree keyed by public path. */
function fakeReader(files: Record<string, string>): SvgReader {
  return (publicPath) => files[publicPath] ?? "";
}

test("reads each variant from its icons.json path, not from its key", () => {
  // Real catalog shape: camelCase keys, kebab-case files (e.g. anthropic).
  const icon = {
    slug: "acme",
    variants: {
      default: "/icons/acme/default.svg",
      wordmarkLight: "/icons/acme/wordmark-light.svg",
      wordmarkDark: "/icons/acme/wordmark-dark.svg",
    },
  };
  const { variants } = resolveSvgs(
    icon,
    fakeReader({
      "/icons/acme/default.svg": "<svg>default</svg>",
      "/icons/acme/wordmark-light.svg": "<svg>light</svg>",
      "/icons/acme/wordmark-dark.svg": "<svg>dark</svg>",
    }),
  );
  assert.deepEqual(variants, {
    default: "<svg>default</svg>",
    wordmarkLight: "<svg>light</svg>",
    wordmarkDark: "<svg>dark</svg>",
  });
});

test("keeps a default variant that points at another file (e.g. color.svg)", () => {
  const icon = {
    slug: "acme",
    variants: { default: "/icons/acme/color.svg", color: "/icons/acme/color.svg" },
  };
  const result = resolveSvgs(icon, fakeReader({ "/icons/acme/color.svg": "<svg>color</svg>" }));
  assert.deepEqual(result.variants, { default: "<svg>color</svg>", color: "<svg>color</svg>" });
  assert.equal(result.primary, "<svg>color</svg>");
});

test("finds a primary SVG stored in another icon folder (e.g. a dated rebrand)", () => {
  const icon = { slug: "acme", variants: { default: "/icons/acme-2026/default.svg" } };
  const result = resolveSvgs(icon, fakeReader({ "/icons/acme-2026/default.svg": "<svg>2026</svg>" }));
  assert.equal(result.primary, "<svg>2026</svg>");
});

test("prefers default, then color, then the first variant with a file", () => {
  const files = {
    "/icons/acme/color.svg": "<svg>color</svg>",
    "/icons/acme/mono.svg": "<svg>mono</svg>",
  };
  const icon = {
    slug: "acme",
    variants: {
      mono: "/icons/acme/mono.svg",
      default: "/icons/acme/missing.svg",
      color: "/icons/acme/color.svg",
    },
  };
  assert.equal(resolveSvgs(icon, fakeReader(files)).primary, "<svg>color</svg>");
});

test("returns no primary when no variant has a file", () => {
  const icon = { slug: "acme", variants: { default: "/icons/acme/default.svg" } };
  assert.deepEqual(resolveSvgs(icon, fakeReader({})), { variants: {}, primary: "" });
});

test("every catalog variant with a file on disk ends up in the built module", () => {
  const icons = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/icons.json"), "utf8")) as RawIcon[];
  const read: SvgReader = (publicPath) => {
    const file = join(REPO_ROOT, "public", publicPath);
    return existsSync(file) ? readFileSync(file, "utf8").trim() : "";
  };

  const dropped: string[] = [];
  for (const icon of icons) {
    const { variants } = resolveSvgs(icon, read);
    for (const [key, publicPath] of Object.entries(icon.variants)) {
      if (publicPath && read(publicPath) && !(key in variants)) dropped.push(`${icon.slug}/${key}`);
    }
  }
  assert.deepEqual(dropped, []);
});

test("never reads a variant path outside /icons/<folder>/<file>.svg", () => {
  const requested: string[] = [];
  const read: SvgReader = (publicPath) => {
    requested.push(publicPath);
    return "<svg/>";
  };
  const icon = {
    slug: "acme",
    variants: {
      default: "/icons/acme/default.svg",
      up: "/icons/../../package.json",
      nested: "/icons/acme/../../../secret.svg",
      notSvg: "/icons/acme/default.js",
      outside: "/og-image.png",
    },
  };
  const { variants } = resolveSvgs(icon, read);
  assert.deepEqual(Object.keys(variants), ["default"]);
  assert.deepEqual(requested, ["/icons/acme/default.svg"]);
});

test("readIconSvg reads only /icons/<folder>/<file>.svg paths", () => {
  const read: SvgReader = () => "<svg/>";
  assert.equal(readIconSvg("/icons/acme/wordmark-light.svg", read), "<svg/>");
  for (const bad of [undefined, "", "/icons/../package.json", "/icons/acme/../../x.svg", "/og-image.png", "icons/acme/a.svg"]) {
    assert.equal(readIconSvg(bad, read), "", `should refuse ${String(bad)}`);
  }
});

test("primarySvg reads lazily in priority order and stops at the first file", () => {
  const requested: string[] = [];
  const files: Record<string, string> = { "/icons/acme/color.svg": "<svg>color</svg>", "/icons/acme/mono.svg": "<svg>mono</svg>" };
  const read: SvgReader = (publicPath) => {
    requested.push(publicPath);
    return files[publicPath] ?? "";
  };
  const svg = primarySvg(
    { mono: "/icons/acme/mono.svg", default: "/icons/acme/missing.svg", color: "/icons/acme/color.svg" },
    read,
  );
  assert.equal(svg, "<svg>color</svg>");
  assert.deepEqual(requested, ["/icons/acme/missing.svg", "/icons/acme/color.svg"]);
});
