import { colorizeCode } from "@/lib/ui-icons/syntax";
import type { SnippetTab } from "@/lib/ui-icons/snippets";

/** A short, colored code sample in the same style as the icon code blocks. */
export function Snippet({ code, lang = "react" }: { code: string; lang?: SnippetTab }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-zinc-950">
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-zinc-300">
        <code className="block whitespace-pre">{colorizeCode(code, lang)}</code>
      </pre>
    </div>
  );
}
