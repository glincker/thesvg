/**
 * build-components.ts
 *
 * Generates the @thesvg/preact distribution: one Preact function component per
 * icon in icons.json, built from the same SVG data as @thesvg/react. Output is
 * pre-compiled h() calls, so no JSX transform is needed to consume it.
 *
 * Run with: tsx scripts/build-components.ts
 */

import { buildDist, scriptDirOf, type Flavor } from "./lib/build-dist.ts";

const RUNTIME_BODY = `
function ns(props, p) {
  const out = {};
  for (const k in props) {
    const v = props[k];
    if (k === 'id') out[k] = p + v;
    else if (k === 'href' && v.charCodeAt(0) === 35) out[k] = '#' + p + v.slice(1);
    else out[k] = v.replace(/url\\(\\s*(&quot;|["'])?#([^)"'&\\s]+)/g, (_m, q, id) => 'url(' + (q || '') + '#' + p + id);
  }
  return out;
}

function nodes(list, p) {
  return list.map((n) =>
    typeof n === 'string' ? n : h(n.type, p ? ns(n.props, p) : n.props, ...nodes(n.children, p)),
  );
}

function makeIcon(name, variants, usesIds) {
  function Icon(props) {
    if (!variants) return null;
    const { variant, viewBox, ...rest } = props;
    const p = usesIds ? 'tsvg' + useId().replace(/[^a-zA-Z0-9]/g, '') + '-' : '';
    const v = variants[variant || 'default'] || variants.default;
    return h(
      'svg',
      Object.assign(
        { xmlns: 'http://www.w3.org/2000/svg', viewBox: viewBox || v.viewBox, fill: v.fill },
        p ? ns(v.attrs, p) : v.attrs,
        rest,
      ),
      ...nodes(v.childNodes, p),
    );
  }
  Object.defineProperty(Icon, 'displayName', { value: name });
  return Icon;
}
`;

const preact: Flavor = {
  pkg: "@thesvg/preact",
  runtimeEsm:
    `import { h } from 'preact';\n` +
    `import { useId } from 'preact/hooks';\n` +
    RUNTIME_BODY +
    `\nexport { makeIcon };\n`,
  runtimeCjs:
    `"use strict";\n` +
    `Object.defineProperty(exports, "__esModule", { value: true });\n` +
    `const { h } = require('preact');\n` +
    `const { useId } = require('preact/hooks');\n` +
    RUNTIME_BODY +
    `\nexports.makeIcon = makeIcon;\n`,
  typesDts: [
    `// @thesvg/preact - shared types`,
    ``,
    `import type { FunctionComponent, JSX } from 'preact';`,
    ``,
    `export type SvgIconProps = JSX.IntrinsicElements['svg'];`,
    `export type SvgIconComponent = FunctionComponent<SvgIconProps>;`,
    ``,
  ].join("\n"),
  iconDts: (name, title, variants) =>
    [
      `// @thesvg/preact - ${title}`,
      `// Auto-generated. Do not edit.`,
      ``,
      `import type { FunctionComponent, JSX } from 'preact';`,
      ``,
      `export type ${name}Variant = ${variants};`,
      ``,
      `export type ${name}Props = JSX.IntrinsicElements['svg'] & {`,
      `  /** Which icon variant to render. Defaults to "default". */`,
      `  variant?: ${name}Variant;`,
      `};`,
      ``,
      `declare const ${name}: FunctionComponent<${name}Props>;`,
      `export default ${name};`,
      ``,
    ].join("\n"),
};

buildDist(preact, scriptDirOf(import.meta.url));
