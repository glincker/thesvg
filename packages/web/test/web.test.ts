import assert from "node:assert/strict";
import { test } from "node:test";

import { createIcons, getIconSvg, type IconSet } from "../src/index.ts";

const github = {
  slug: "github",
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0"/></svg>',
  variants: { mono: '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>' },
};
const icons: IconSet = { github, _1password: { slug: "1password", svg: "<svg></svg>" } };

// Minimal DOM stub: just the surface createIcons touches.
class StubEl {
  attributes: { name: string; value: string }[] = [];
  parent: StubRoot | null = null;
  outer = "";
  ownerDocument: StubDoc;
  constructor(doc: StubDoc, attrs: Record<string, string> = {}) {
    this.ownerDocument = doc;
    for (const [name, value] of Object.entries(attrs)) this.attributes.push({ name, value });
  }
  getAttribute(n: string): string | null {
    return this.attributes.find((a) => a.name === n)?.value ?? null;
  }
  setAttribute(n: string, v: string): void {
    const found = this.attributes.find((a) => a.name === n);
    if (found) found.value = v;
    else this.attributes.push({ name: n, value: v });
  }
  replaceWith(next: StubEl): void {
    const list = this.parent!.children;
    list[list.indexOf(this)] = next;
  }
  get html(): string {
    return this.outer.replace(/^<svg\b/, `<svg${this.attributes.filter((a) => !this.outer.includes(` ${a.name}=`)).map((a) => ` ${a.name}="${a.value}"`).join("")}`);
  }
}
class StubRoot {
  children: StubEl[] = [];
  querySelectorAll(sel: string): StubEl[] {
    const attr = sel.slice(1, -1);
    return this.children.filter((c) => c.getAttribute(attr) !== null);
  }
}
class StubDoc {
  private readonly self: StubDoc = this;
  createElement(): { content: { firstElementChild: StubEl | null }; innerHTML: string } {
    const doc = this.self;
    const t = {
      content: { firstElementChild: null as StubEl | null },
      set innerHTML(html: string) {
        const el = new StubEl(doc);
        el.outer = html;
        const tag = /<svg\b([^>]*)>/.exec(html)![1];
        for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) el.setAttribute(m[1], m[2]);
        t.content.firstElementChild = el;
      },
    };
    return t as never;
  }
}

function setup(attrs: Record<string, string>[]): { root: StubRoot; doc: StubDoc } {
  const doc = new StubDoc();
  const root = new StubRoot();
  for (const a of attrs) {
    const el = new StubEl(doc, a);
    el.parent = root;
    root.children.push(el);
  }
  return { root, doc };
}

test("getIconSvg returns svg for an icon module and applies options", () => {
  const out = getIconSvg(github, { size: 32, className: "logo", title: "GitHub" })!;
  assert.match(out, /width="32"/);
  assert.match(out, /height="32"/);
  assert.match(out, /class="logo"/);
  assert.match(out, /aria-label="GitHub"/);
  assert.equal((out.match(/width=/g) ?? []).length, 1);
});

test("getIconSvg resolves names, slugs and variants, and rejects unknowns", () => {
  assert.ok(getIconSvg("github", { icons }));
  assert.ok(getIconSvg("1password", { icons }));
  assert.match(getIconSvg("github", { icons, variant: "mono" })!, /M1 1/);
  assert.match(getIconSvg("github", { icons, variant: "missing" })!, /M0 0/);
  assert.equal(getIconSvg("nope", { icons }), undefined);
  assert.match(getIconSvg("github", { icons })!, /aria-hidden="true"/);
});

test("createIcons replaces matching elements and keeps unknown ones", () => {
  const { root } = setup([
    { "data-thesvg": "github", id: "a" },
    { "data-thesvg": "unknown", id: "b" },
    { id: "c" },
  ]);
  const n = createIcons({ icons, root: root as unknown as ParentNode });
  assert.equal(n, 1);
  assert.equal(root.children[0].getAttribute("id"), "a");
  assert.equal(root.children[0].getAttribute("data-thesvg"), null);
  assert.match(root.children[0].outer, /<svg/);
  assert.equal(root.children[1].getAttribute("data-thesvg"), "unknown");
});

test("createIcons honours a custom nameAttr, variant and size", () => {
  const { root } = setup([{ "data-icon": "github", "data-icon-variant": "mono", "data-icon-size": "48" }]);
  const n = createIcons({ icons, nameAttr: "data-icon", root: root as unknown as ParentNode });
  assert.equal(n, 1);
  assert.match(root.children[0].outer, /M1 1/);
  assert.equal(root.children[0].getAttribute("width"), "48");
});

const zulip = {
  slug: "zulip",
  svg: '<svg viewBox="0 0 24 24"><defs><linearGradient id="a"><stop offset="0"/></linearGradient><clipPath id="c"><rect/></clipPath><mask id="m"><rect/></mask><filter id="f"/><pattern id="p"/><symbol id="s"/></defs><path fill="url(#a)" clip-path="url(\'#c\')" mask="url(#m)" filter="url(#f)" stroke="url(#p)"/><use href="#s"/><use xlink:href="#a"/><g aria-labelledby="a nope"/><style>#a{fill:red}</style></svg>',
};

test("getIconSvg gives each call unique ids and rewrites every reference", () => {
  const one = getIconSvg(zulip)!;
  const two = getIconSvg(zulip)!;
  const idsOf = (s: string): string[] => Array.from(s.matchAll(/\sid="([^"]+)"/g), (m) => m[1]);
  const a = idsOf(one);
  const b = idsOf(two);
  assert.equal(a.length, 6);
  for (const id of a) assert.ok(!b.includes(id), `${id} reused`);
  const prefix = /^(thesvg-\d+-)a$/.exec(a[0])![1];
  assert.match(one, new RegExp(`fill="url\\(#${prefix}a\\)"`));
  assert.match(one, new RegExp(`clip-path="url\\('#${prefix}c'\\)"`));
  assert.match(one, new RegExp(`mask="url\\(#${prefix}m\\)"`));
  assert.match(one, new RegExp(`filter="url\\(#${prefix}f\\)"`));
  assert.match(one, new RegExp(`stroke="url\\(#${prefix}p\\)"`));
  assert.match(one, new RegExp(` href="#${prefix}s"`));
  assert.match(one, new RegExp(`xlink:href="#${prefix}a"`));
  assert.match(one, new RegExp(`aria-labelledby="${prefix}a nope"`));
  assert.match(one, new RegExp(`#${prefix}a\\{fill:red\\}`));
  assert.doesNotMatch(one, /url\(#a\)/);
});

test("getIconSvg does not touch svgs without ids", () => {
  assert.doesNotMatch(getIconSvg(github)!, /thesvg-/);
});

test("getIconSvg skips aria-hidden when an accessible name is supplied", () => {
  assert.doesNotMatch(getIconSvg(github, { attrs: { "aria-label": "GitHub" } })!, /aria-hidden/);
  assert.doesNotMatch(getIconSvg(github, { attrs: { "aria-labelledby": "lbl" } })!, /aria-hidden/);
  assert.doesNotMatch(getIconSvg(github, { title: "GitHub" })!, /aria-hidden/);
  assert.match(getIconSvg(github)!, /aria-hidden="true"/);
});

test("createIcons keeps a named placeholder exposed and decorative ones hidden", () => {
  const { root } = setup([
    { "data-thesvg": "github", role: "img", "aria-label": "GitHub" },
    { "data-thesvg": "github" },
  ]);
  createIcons({ icons, root: root as unknown as ParentNode });
  assert.doesNotMatch(root.children[0].outer, /aria-hidden/);
  assert.equal(root.children[0].getAttribute("aria-label"), "GitHub");
  assert.match(root.children[1].outer, /aria-hidden="true"/);
});
