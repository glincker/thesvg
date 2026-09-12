import type { SnippetFormat } from "@/lib/code-snippets";

/** Escape HTML so raw code is safe inside dangerouslySetInnerHTML */
export function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Wrap text in a colored span using placeholder markers first, then expand */
export function colorize(line: string, format: SnippetFormat): string {
  let s = esc(line);

  const S = "\uE000";
  const E = "\uE001";
  const tag = (cls: string, text: string) => `${S}${cls}${E}${text}${S}/${E}`;

  if (format === "css") {
    s = s
      .replace(/([\w-]+)(\s*:\s*)/g, (_, p, c) => tag("text-purple-400", p) + c)
      .replace(/:\s*([^;]+)(;?)/g, (_, v, sc) => ": " + tag("text-green-400", v) + sc)
      .replace(/^(\.[^\s{]+)/gm, (_, sel) => tag("text-blue-400", sel));
  } else if (format === "html" || format === "vue") {
    s = s
      .replace(/(&lt;)(\/?\w+)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-purple-400", a) + eq)
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`));
  } else {
    s = s
      .replace(/\b(import|from|export|default|function|return|const)\b/g, (_, k) => tag("text-purple-400", k))
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`))
      .replace(/'([^']*)'/g, (_, v) => tag("text-green-400", `'${v}'`))
      .replace(/(&lt;)(\/?\w+)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-orange-300", a) + eq);
  }

  s = s.replace(new RegExp(`${S}/${E}`, "g"), "</span>");
  s = s.replace(new RegExp(`${S}([^${E}]+)${E}`, "g"), '<span class="$1">');
  return s;
}

export function colorizeSnippet(code: string, format: SnippetFormat): React.ReactNode {
  return code.split("\n").map((line, i, arr) => (
    <span key={i}>
      <span dangerouslySetInnerHTML={{ __html: colorize(line, format) }} />
      {i < arr.length - 1 ? "\n" : ""}
    </span>
  ));
}

export function colorizeSvgCode(code: string): React.ReactNode {
  return code.split("\n").map((line, i, arr) => {
    let s = esc(line);
    const S = "\uE000", E = "\uE001";
    const tag = (cls: string, text: string) => `${S}${cls}${E}${text}${S}/${E}`;
    s = s
      .replace(/(&lt;)(\/?\w[\w-]*)/g, (_, lt, t) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a, eq) => tag("text-purple-400", a) + eq)
      .replace(/"([^"]*)"/g, (_, v) => tag("text-green-400", `"${v}"`));
    s = s.replace(new RegExp(`${S}/${E}`, "g"), "</span>");
    s = s.replace(new RegExp(`${S}([^${E}]+)${E}`, "g"), '<span class="$1">');
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: s }} />
        {i < arr.length - 1 ? "\n" : ""}
      </span>
    );
  });
}

export function formatSvgCode(raw: string): string {
  return raw
    .replace(/>\s*</g, ">\n<")
    .replace(/\s{2,}/g, " ")
    .trim();
}
