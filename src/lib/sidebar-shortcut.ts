type ShortcutEvent = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "repeat"
>;

/** True for Cmd+\ (Mac) or Ctrl+\ (elsewhere): exactly one of meta or ctrl,
 * no alt, no shift, and not an auto-repeat. */
export function isSidebarToggleShortcut(e: ShortcutEvent): boolean {
  if (e.key !== "\\") return false;
  if (e.metaKey === e.ctrlKey) return false;
  return !e.altKey && !e.shiftKey && !e.repeat;
}

/** True when the element is a text-entry context where shortcuts must not fire. */
export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ("isContentEditable" in el && el.isContentEditable === true) return true;
  const attr = el.getAttribute("contenteditable");
  return attr !== null && attr !== "false";
}
