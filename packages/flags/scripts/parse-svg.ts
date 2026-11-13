const ROOT_SKIP = new Set(["xmlns", "xmlns:xlink", "viewBox", "width", "height", "xml:space", "id", "version"]);

/** Root attributes other than viewBox and namespaces (fill, stroke, fill-rule and so on) that children inherit. */
export function parse(svg: string): { viewBox: string; inner: string } {
  const m = svg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
  const vb = m?.[1].match(/viewBox="([^"]+)"/)?.[1];
  if (!m || !vb) throw new Error("unparseable svg");
  const inherited = [...m[1].matchAll(/\s([\w:-]+)="([^"]*)"/g)].filter((a) => !ROOT_SKIP.has(a[1]));
  const body = m[2].replace(/<title>[\s\S]*?<\/title>/, "");
  const inner = inherited.length > 0 ? `<g${inherited.map((a) => ` ${a[1]}="${a[2]}"`).join("")}>${body}</g>` : body;
  return { viewBox: vb, inner };
}

