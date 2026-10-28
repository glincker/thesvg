// Motion for UI icons, in plain CSS inside the svg: no animation library, and it works in React, Vue, Svelte and in a
// standalone svg file. A preset is a name:
//   draw    pop in with a spring and draw the strokes one after another, once (what `animated` alone means)
//   pop     the spring only, once
//   bounce  a short hop, once
//   ring    a swing from the top, once (a bell)
//   spin    turns forever (a loader)
//   pulse   breathes forever (a heart)
// Plain ES module with no dependencies: package-builder copies it into every package as _anim.js.
export const PRESETS = ["draw", "pop", "bounce", "ring", "spin", "pulse"];

// Icons that also ship a ready-made `<look>-animated.svg`, with the preset each one uses.
export const ANIMATED = {
  sun: "draw",
  moon: "draw",
  "theme-system": "draw",
  "loader-circle": "spin",
  "refresh-cw": "spin",
  heart: "pulse",
  bell: "ring",
};
export const ANIMATED_SLUGS = Object.keys(ANIMATED);

const SHAPES = /<(path|circle|rect|line|polyline|polygon|ellipse)(?=[\s/>])/g;

const FRAMES = {
  pop: "@keyframes ua-pop{from{transform:scale(0) rotate(-90deg);opacity:0}to{transform:none;opacity:1}}",
  bounce: "@keyframes ua-bounce{0%{transform:translateY(0)}35%{transform:translateY(-3.5px)}65%{transform:translateY(.6px)}100%{transform:translateY(0)}}",
  ring: "@keyframes ua-ring{0%{transform:rotate(0)}15%{transform:rotate(16deg)}30%{transform:rotate(-13deg)}45%{transform:rotate(9deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}100%{transform:rotate(0)}}",
  spin: "@keyframes ua-spin{to{transform:rotate(360deg)}}",
  pulse: "@keyframes ua-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}",
  draw: "@keyframes ua-draw{to{stroke-dashoffset:0}}",
};

const MOTION = {
  draw: "animation:ua-pop .6s cubic-bezier(.34,1.56,.64,1) both",
  pop: "animation:ua-pop .6s cubic-bezier(.34,1.56,.64,1) both",
  bounce: "animation:ua-bounce .7s cubic-bezier(.28,.84,.42,1) both",
  ring: "transform-origin:12px 3px;animation:ua-ring 1s ease-in-out both",
  spin: "animation:ua-spin .9s linear infinite",
  pulse: "animation:ua-pulse 1.4s ease-in-out infinite",
};

const preset = (p) => (PRESETS.includes(p) ? p : "draw");

const css = (cls, name) => {
  let out = "." + cls + "{transform-box:view-box;transform-origin:12px 12px;" + MOTION[name] + "}";
  out += "@media (prefers-reduced-motion:reduce){." + cls + "{animation:none!important}";
  if (name === "draw") {
    out += "." + cls + ">g[stroke]>*{animation:none!important;stroke-dasharray:none!important;stroke-dashoffset:0!important}";
  }
  out += "}";
  if (name === "draw") {
    out += "." + cls + ">g[stroke]>*{stroke-dasharray:1 1;stroke-dashoffset:1;animation:ua-draw .55s ease-out forwards}";
    for (let i = 1; i <= 12; i++) out += "." + cls + ">g[stroke]>:nth-child(" + i + "){animation-delay:" + (0.04 + i * 0.045).toFixed(3) + "s}";
    out += FRAMES.draw;
  }
  return out + FRAMES[name === "draw" ? "pop" : name];
};

const wrap = (html, cls, name) =>
  "<style>" + css(cls, name) + '</style><g class="' + cls + '">' + (name === "draw" ? html.replace(SHAPES, '<$1 pathLength="1"') : html) + "</g>";

/**
 * Inner markup of an icon, wrapped so it moves. `kind` is a preset name, or true for draw. uid keeps two icons on a page apart.
 * @param {string} html
 * @param {string | number} uid
 * @param {string | boolean} [kind]
 * @returns {{ cls: string, html: string }}
 */
export const animate = (html, uid, kind = "draw") => {
  const cls = "ua-" + uid;
  return { cls, html: wrap(html, cls, preset(kind)) };
};

/**
 * A whole standalone svg file, moving on load.
 * @param {string} svg
 * @param {string} [kind]
 * @returns {string}
 */
export const animateSvg = (svg, kind = "draw") => svg.replace(/^(<svg[^>]*>)([\s\S]*)(<\/svg>)\s*$/, (_m, open, body, close) => open + wrap(body, "ua", preset(kind)) + close);
