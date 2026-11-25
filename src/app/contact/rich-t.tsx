"use client";

import { Fragment, type ReactNode } from "react";
import { useT } from "@/i18n/use-t";

// Control character that cannot appear in copy, so it is safe as a split marker.
const MARK = "\u0001";

/** Translated sentence with inline elements (links, code) slotted into {{name}} placeholders. */
export function RichT({ k, fallback, slots }: Readonly<{ k: string; fallback?: string; slots: Record<string, ReactNode> }>) {
  const { t } = useT();
  const markers = Object.fromEntries(Object.keys(slots).map((name) => [name, `${MARK}${name}${MARK}`]));
  const text = t(k, { defaultValue: fallback, ...markers });
  return (
    <>
      {text.split(MARK).map((part, i) => (i % 2 === 1 ? <Fragment key={i}>{slots[part]}</Fragment> : part))}
    </>
  );
}
