/**
 * build-components.ts
 *
 * Generates the @thesvg/solid distribution: one Solid component per icon in
 * icons.json, built from the same SVG data as @thesvg/react. Elements render
 * through solid-js/web's Dynamic, so the output works for both DOM and SSR
 * without a JSX compile step.
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
    else out[k] = v.replace(/url\\(#([^)]+)\\)/g, (_m, id) => 'url(#' + p + id + ')');
  }
  return out;
}

function nodes(list, p) {
  return list.map((n) => {
    if (typeof n === 'string') return n;
    const props = Object.assign({ component: n.type }, p ? ns(n.props, p) : n.props);
    if (n.children.length) props.children = nodes(n.children, p);
    return createComponent(Dynamic, props);
  });
}

function makeIcon(name, variants, usesIds) {
  function Icon(props) {
    if (!variants) return null;
    const [local, rest] = splitProps(props, ['variant', 'viewBox']);
    const p = usesIds ? 'tsvg' + createUniqueId().replace(/[^a-zA-Z0-9]/g, '') + '-' : '';
    const cur = () => variants[local.variant || 'default'] || variants.default;
    return createComponent(
      Dynamic,
      mergeProps(
        {
          component: 'svg',
          xmlns: 'http://www.w3.org/2000/svg',
          get viewBox() { return local.viewBox || cur().viewBox; },
          get fill() { return cur().fill; },
          get stroke() { return cur().stroke; },
          get children() { return nodes(cur().childNodes, p); },
        },
        rest,
      ),
    );
  }
  Object.defineProperty(Icon, 'name', { value: name });
  return Icon;
}
`;

const solid: Flavor = {
  pkg: "@thesvg/solid",
  runtimeEsm:
    `import { splitProps, mergeProps, createUniqueId } from 'solid-js';\n` +
    `import { Dynamic, createComponent } from 'solid-js/web';\n` +
    RUNTIME_BODY +
    `\nexport { makeIcon };\n`,
  runtimeCjs:
    `"use strict";\n` +
    `Object.defineProperty(exports, "__esModule", { value: true });\n` +
    `const { splitProps, mergeProps, createUniqueId } = require('solid-js');\n` +
    `const { Dynamic, createComponent } = require('solid-js/web');\n` +
    RUNTIME_BODY +
    `\nexports.makeIcon = makeIcon;\n`,
  typesDts: [
    `// @thesvg/solid - shared types`,
    ``,
    `import type { Component, JSX } from 'solid-js';`,
    ``,
    `export type SvgIconProps = JSX.SvgSVGAttributes<SVGSVGElement>;`,
    `export type SvgIconComponent = Component<SvgIconProps>;`,
    ``,
  ].join("\n"),
  iconDts: (name, title, variants) =>
    [
      `// @thesvg/solid - ${title}`,
      `// Auto-generated. Do not edit.`,
      ``,
      `import type { Component, JSX } from 'solid-js';`,
      ``,
      `export type ${name}Variant = ${variants};`,
      ``,
      `export interface ${name}Props extends JSX.SvgSVGAttributes<SVGSVGElement> {`,
      `  /** Which icon variant to render. Defaults to "default". */`,
      `  variant?: ${name}Variant;`,
      `}`,
      ``,
      `declare const ${name}: Component<${name}Props>;`,
      `export default ${name};`,
      ``,
    ].join("\n"),
};

buildDist(solid, scriptDirOf(import.meta.url));
