import { describe, expect, it } from "vitest";
import { isSidebarToggleShortcut, isTypingTarget } from "./sidebar-shortcut";

const base = { key: "\\", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, repeat: false };

describe("isSidebarToggleShortcut", () => {
  it("accepts meta+backslash", () => {
    expect(isSidebarToggleShortcut({ ...base, metaKey: true })).toBe(true);
  });
  it("accepts ctrl+backslash", () => {
    expect(isSidebarToggleShortcut({ ...base, ctrlKey: true })).toBe(true);
  });
  it("rejects both meta and ctrl", () => {
    expect(isSidebarToggleShortcut({ ...base, metaKey: true, ctrlKey: true })).toBe(false);
  });
  it("rejects no modifier", () => {
    expect(isSidebarToggleShortcut(base)).toBe(false);
  });
  it("rejects alt", () => {
    expect(isSidebarToggleShortcut({ ...base, ctrlKey: true, altKey: true })).toBe(false);
  });
  it("rejects shift", () => {
    expect(isSidebarToggleShortcut({ ...base, ctrlKey: true, shiftKey: true })).toBe(false);
  });
  it("rejects repeat", () => {
    expect(isSidebarToggleShortcut({ ...base, metaKey: true, repeat: true })).toBe(false);
  });
  it("rejects other keys", () => {
    expect(isSidebarToggleShortcut({ ...base, metaKey: true, key: "b" })).toBe(false);
    expect(isSidebarToggleShortcut({ ...base, metaKey: true, key: "/" })).toBe(false);
  });
});

describe("isTypingTarget", () => {
  // Vitest runs in node here, so use minimal element stand-ins.
  const make = (tag: string, attrs: Record<string, string> = {}): Element =>
    ({
      tagName: tag.toUpperCase(),
      getAttribute: (name: string) => attrs[name] ?? null,
    }) as unknown as Element;
  it("is false for null and plain elements", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(make("div"))).toBe(false);
    expect(isTypingTarget(make("button"))).toBe(false);
  });
  it("is true for input, textarea, select", () => {
    expect(isTypingTarget(make("input"))).toBe(true);
    expect(isTypingTarget(make("textarea"))).toBe(true);
    expect(isTypingTarget(make("select"))).toBe(true);
  });
  it("is true when isContentEditable is set", () => {
    const el = { ...make("div"), isContentEditable: true } as unknown as Element;
    expect(isTypingTarget(el)).toBe(true);
  });
  it("is true for contenteditable", () => {
    expect(isTypingTarget(make("div", { contenteditable: "true" }))).toBe(true);
    expect(isTypingTarget(make("div", { contenteditable: "" }))).toBe(true);
    expect(isTypingTarget(make("div", { contenteditable: "false" }))).toBe(false);
  });
});
