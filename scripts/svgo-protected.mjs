// Reads icon SVG paths on stdin, prints only those SVGO may rewrite.
// Icons whose license forbids modification are dropped from the list.
import { readFileSync } from "node:fs";
import { requiresUnmodifiedSvg } from "../src/lib/license-terms.mjs";

const icons = JSON.parse(readFileSync("src/data/icons.json", "utf8"));
const locked = new Set(
  icons.filter((i) => requiresUnmodifiedSvg(i.license)).map((i) => i.slug),
);

const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
for (const f of files) {
  const slug = f.split("/")[2];
  if (!locked.has(slug)) console.log(f);
}
