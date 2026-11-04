const svg = '<g id="a-g"/><g id="a-grid"/><rect fill="url(#a-g)" mask="url(#a-m)"/><mask id="a-m"/>';
const idSet = new Set<string>();
for (const m of svg.matchAll(/\bid="([^"]+)"/g)) {
  idSet.add(m[1]);
}
const ids = Array.from(idSet);
console.log(ids);
