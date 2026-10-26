import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { INTERFACE_SIZES, INTERFACE_SIZE_ATTRIBUTE, INTERFACE_SIZE_SCRIPT, SETTINGS_STORAGE_KEY, parseInterfaceSize } from "../interface-size";

function runScript(stored: string | null): string | null {
  const setAttribute = vi.fn();
  const localStorage = { getItem: (key: string) => (key === SETTINGS_STORAGE_KEY ? stored : null) };
  new Function("localStorage", "document", INTERFACE_SIZE_SCRIPT)(localStorage, { documentElement: { setAttribute } });
  return setAttribute.mock.calls.length ? `${setAttribute.mock.calls[0][0]}=${setAttribute.mock.calls[0][1]}` : null;
}

describe("parseInterfaceSize", () => {
  it("accepts the known sizes and falls back to default for anything else", () => {
    for (const s of INTERFACE_SIZES) expect(parseInterfaceSize(s.id)).toBe(s.id);
    expect(parseInterfaceSize("huge")).toBe("default");
    expect(parseInterfaceSize(undefined)).toBe("default");
    expect(parseInterfaceSize(12)).toBe("default");
  });
});

describe("head script", () => {
  it("applies a saved large size before first paint", () => {
    expect(runScript(JSON.stringify({ state: { interfaceSize: "large" }, version: 0 }))).toBe(`${INTERFACE_SIZE_ATTRIBUTE}=large`);
    expect(runScript(JSON.stringify({ state: { interfaceSize: "larger" }, version: 0 }))).toBe(`${INTERFACE_SIZE_ATTRIBUTE}=larger`);
  });

  it("does nothing for the default size, a missing value, or storage that is empty or broken", () => {
    expect(runScript(JSON.stringify({ state: { interfaceSize: "default" } }))).toBeNull();
    expect(runScript(JSON.stringify({ state: {} }))).toBeNull();
    expect(runScript(null)).toBeNull();
    expect(runScript("{not json")).toBeNull();
    expect(runScript(JSON.stringify({ state: { interfaceSize: "<script>" } }))).toBeNull();
  });
});

describe("matching CSS", () => {
  const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");

  it("sets a root font size for every size except the default", () => {
    for (const s of INTERFACE_SIZES.filter((x) => x.id !== "default")) {
      const rule = new RegExp(`html\\[${INTERFACE_SIZE_ATTRIBUTE}="${s.id}"\\]\\s*\\{[^}]*font-size:\\s*${s.percent}%`);
      expect(css, `${s.id} should set ${s.percent}%`).toMatch(rule);
    }
  });
});
