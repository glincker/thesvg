"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useT } from "@/i18n/use-t";

const TOKEN = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

/** Translated text where `code` spans and [label](href) links stay markup, so
 * translators cannot break the elements and code remains English. */
export function DocsText({ k, fallback, values }: Readonly<{ k: string; fallback: string; values?: Record<string, string> }>) {
  const { t } = useT();
  const text = t(k, { defaultValue: fallback, ...values });
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link;
          return href.startsWith("/") ? (
            <Link key={i} className="underline" href={href}>{label}</Link>
          ) : (
            <a key={i} className="underline" href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
