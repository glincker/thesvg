import type { SnippetTab } from "./snippets";

// Token colors and approach follow thesvg's own code block so both sections look the same.
const S = "";
const E = "";
const tag = (cls: string, text: string): string => `${S}${cls}${E}${text}${S}/${E}`;

function esc(str: string): string {
  return str.replace(/[]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function expand(s: string): string {
  return s.replace(new RegExp(`${S}/${E}`, "g"), "</span>").replace(new RegExp(`${S}([^${E}]+)${E}`, "g"), '<span class="$1">');
}

function colorize(line: string, tab: SnippetTab): string {
  let s = esc(line);
  if (tab === "uri") return s;
  if (tab === "css") {
    s = s
      .replace(/([\w-]+)(\s*:\s*)/g, (_, p: string, c: string) => tag("text-purple-400", p) + c)
      .replace(/:\s*([^;]+)(;?)/g, (_, v: string, sc: string) => `: ${tag("text-green-400", v)}${sc}`)
      .replace(/^(\.[^\s{]+)/g, (_, sel: string) => tag("text-blue-400", sel));
  } else if (tab === "react") {
    s = s
      .replace(/\b(import|from|export|default|function|return|const|type)\b/g, (_, k: string) => tag("text-purple-400", k))
      .replace(/&quot;([^&]*)&quot;/g, (_, v: string) => tag("text-green-400", `&quot;${v}&quot;`))
      .replace(/(&lt;)(\/?\w[\w-]*)/g, (_, lt: string, t: string) => lt + tag("text-pink-400", t))
      .replace(/([\w-]+)(=)/g, (_, a: string, eq: string) => tag("text-orange-300", a) + eq);
  } else {
    s = s
      .replace(/(&lt;)(\/?\w[\w-]*)/g, (_, lt: string, t: string) => lt + tag("text-pink-400", t))
      .replace(/([\w:@.$-]+)(=)/g, (_, a: string, eq: string) => tag("text-purple-400", a) + eq)
      .replace(/&quot;([^&]*)&quot;/g, (_, v: string) => tag("text-green-400", `&quot;${v}&quot;`));
  }
  return expand(s);
}

export function colorizeCode(code: string, shown: SnippetTab): React.ReactNode {
  const tab: SnippetTab = shown === "native" ? "react" : shown === "js" ? "html" : shown;
  return code.split("\n").map((line, i, arr) => (
    <span key={i}>
      <span dangerouslySetInnerHTML={{ __html: colorize(line, tab) }} />
      {i < arr.length - 1 ? "\n" : ""}
    </span>
  ));
}
