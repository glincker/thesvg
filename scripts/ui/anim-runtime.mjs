// Entrance motion for UI icons, in plain CSS inside the svg, so it needs no animation library and works in React, Vue,
// Svelte and in a standalone svg file. The icon pops in with a spring and its strokes draw themselves one after another.
// Plain ES module with no dependencies: package-builder copies it into every package as _anim.js.
export const ANIMATED_SLUGS = ["sun", "moon", "theme-system"];

const SHAPES = /<(path|circle|rect|line|polyline|polygon|ellipse)(?=[\s/>])/g;

const css = (cls) => {
  let delays = "";
  for (let i = 1; i <= 12; i++) delays += "." + cls + ">g[stroke]>:nth-child(" + i + "){animation-delay:" + (0.04 + i * 0.045).toFixed(3) + "s}";
  return (
    "." + cls + "{transform-box:view-box;transform-origin:12px 12px;animation:ua-pop .6s cubic-bezier(.34,1.56,.64,1) both}" +
    "." + cls + ">g[stroke]>*{stroke-dasharray:1 1;stroke-dashoffset:1;animation:ua-draw .55s ease-out forwards}" +
    delays +
    "@keyframes ua-pop{from{transform:scale(0) rotate(-90deg);opacity:0}to{transform:none;opacity:1}}" +
    "@keyframes ua-draw{to{stroke-dashoffset:0}}" +
    "@media (prefers-reduced-motion:reduce){." + cls + ",." + cls + ">g[stroke]>*{animation:none!important;stroke-dasharray:none!important;stroke-dashoffset:0!important}}"
  );
};

const wrap = (html, cls) => "<style>" + css(cls) + '</style><g class="' + cls + '">' + html.replace(SHAPES, '<$1 pathLength="1"') + "</g>";

/** Inner markup of an icon, wrapped so it animates. uid keeps two icons on one page from sharing a class. */
export const animate = (html, uid) => {
  const cls = "ua-" + uid;
  return { cls, html: wrap(html, cls) };
};

/** A whole standalone svg file, animated on load. */
export const animateSvg = (svg) => svg.replace(/^(<svg[^>]*>)([\s\S]*)(<\/svg>)\s*$/, (_m, open, body, close) => open + wrap(body, "ua") + close);
