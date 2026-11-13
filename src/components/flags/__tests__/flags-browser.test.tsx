// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FlagsBrowser } from "@/components/flags/flags-browser";
import { detectFlag } from "@/components/flags/your-flag-card";
import { nativeLanguageName } from "@/components/flags/languages-mode";
import { PREFS_KEY, RECENT_KEY } from "@/lib/flags-browser/storage";
import { getFlagTiles } from "@/lib/flags-tiles";

const tiles = getFlagTiles();
const aliasJson = readFileSync(join(__dirname, "../../../../public/data/flags-search.json"), "utf8");

function setLanguages(langs: string[]): void {
  Object.defineProperty(window.navigator, "languages", { value: langs, configurable: true });
  Object.defineProperty(window.navigator, "language", { value: langs[0], configurable: true });
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/collection/flags");
  setLanguages(["en-US"]);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(aliasJson, { status: 200 })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const count = (): string => screen.getByTestId("result-count").textContent ?? "";
const tileImgs = (): HTMLImageElement[] => [...document.querySelectorAll<HTMLImageElement>("[data-flag-tile] img")];

describe("flags browser", () => {
  it("renders every flag as a lazy image with explicit dimensions and no giant DOM per tile", async () => {
    render(<FlagsBrowser tiles={tiles} />);
    await waitFor(() => expect(screen.getByTestId("flags-browser").dataset.ready).toBe("true"));
    expect(count()).toBe(`${tiles.length} of ${tiles.length} flags`);
    const first = tileImgs()[0];
    expect(first.getAttribute("loading")).toBe("lazy");
    expect(first.getAttribute("decoding")).toBe("async");
    expect(first.getAttribute("width")).toBeTruthy();
    expect(first.getAttribute("height")).toBeTruthy();
    expect(first.getAttribute("alt")).toBe("");
    expect(document.querySelectorAll("[data-flag-tile]").length).toBe(tiles.length);
  });

  it("searches by alias after the alias file loads, shows count and empty state", async () => {
    render(<FlagsBrowser tiles={tiles} />);
    const box = screen.getByLabelText("Search flags");
    fireEvent.change(box, { target: { value: "deutschland" } });
    await waitFor(() => expect(count()).toBe(`1 of ${tiles.length} flags`));
    expect(document.querySelector("[data-flag-tile='de']")).not.toBeNull();
    fireEvent.change(box, { target: { value: "日本" } });
    await waitFor(() => expect(document.querySelector("[data-flag-tile='jp']")).not.toBeNull());
    fireEvent.change(box, { target: { value: "qqqqqqq" } });
    await waitFor(() => expect(screen.getByTestId("empty-state")).toBeTruthy());
    expect(count()).toBe(`0 of ${tiles.length} flags`);
  });

  it("filters by region chip and color chips and can clear", () => {
    render(<FlagsBrowser tiles={tiles} />);
    fireEvent.click(screen.getByRole("button", { name: "Regional" }));
    expect(count()).toMatch(/^\d+ of \d+ flags$/);
    expect(document.querySelector("[data-flag-tile='gb-eng']")).not.toBeNull();
    expect(document.querySelector("[data-flag-tile='de']")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(count()).toBe(`${tiles.length} of ${tiles.length} flags`);
    fireEvent.click(screen.getByRole("button", { name: "green" }));
    fireEvent.click(screen.getByRole("button", { name: "orange" }));
    fireEvent.click(screen.getByRole("button", { name: "Any color" }));
    expect(document.querySelector("[data-flag-tile='ie']")).not.toBeNull();
  });

  it("switches every tile to the chosen shape and remembers it", () => {
    const { unmount } = render(<FlagsBrowser tiles={tiles} />);
    fireEvent.click(screen.getByRole("radio", { name: "Circle" }));
    expect(tileImgs().every((i) => i.getAttribute("src")!.endsWith("/circle.svg"))).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "L" }));
    expect(tileImgs()[0].getAttribute("height")).toBe("64");
    expect(JSON.parse(window.localStorage.getItem(PREFS_KEY)!)).toMatchObject({ variant: "circle", size: "l" });
    unmount();
    window.history.replaceState(null, "", "/collection/flags");
    render(<FlagsBrowser tiles={tiles} />);
    expect(tileImgs()[0].getAttribute("src")).toMatch(/circle\.svg$/);
  });

  it("works when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<FlagsBrowser tiles={tiles} />);
    fireEvent.click(screen.getByRole("radio", { name: "Square" }));
    expect(tileImgs()[0].getAttribute("src")).toMatch(/square\.svg$/);
    expect(count()).toBe(`${tiles.length} of ${tiles.length} flags`);
  });

  it("reads filters from the URL and writes them back so a view is shareable", async () => {
    window.history.replaceState(null, "", "/collection/flags?region=europe&variant=circle&q=germany");
    render(<FlagsBrowser tiles={tiles} />);
    await waitFor(() => expect(count()).toBe(`1 of ${tiles.length} flags`));
    expect(tileImgs()[0].getAttribute("src")).toMatch(/flag-de\/circle\.svg$/);
    fireEvent.click(screen.getByRole("button", { name: "Asia" }));
    expect(window.location.search).toContain("region=asia");
    expect(window.location.search).toContain("variant=circle");
  });

  it("opens the detail panel from ?flag= with all three variants, snippets and palette, and records it as recent", async () => {
    window.history.replaceState(null, "", "/collection/flags?flag=fr");
    render(<FlagsBrowser tiles={tiles} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("France")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "React import" })).toBeTruthy();
    expect(within(dialog).getAllByRole("link", { name: /Download/ })).toHaveLength(3);
    expect(within(dialog).getByRole("button", { name: /Copy #0?0?0091/i })).toBeTruthy();
    expect(within(dialog).getByText(/MIT/)).toBeTruthy();
  });

  it("clicking a tile pushes ?flag= and stores a recent entry", async () => {
    render(<FlagsBrowser tiles={tiles} />);
    fireEvent.click(document.querySelector<HTMLElement>("[data-flag-button='de']")!);
    expect(window.location.search).toContain("flag=de");
    expect(JSON.parse(window.localStorage.getItem(RECENT_KEY)!)).toEqual(["de"]);
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("moves focus with the arrow keys, Home and End", () => {
    render(<FlagsBrowser tiles={tiles} />);
    const buttons = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("[data-flag-button]")];
    buttons()[0].focus();
    fireEvent.keyDown(buttons()[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(buttons()[1]);
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(buttons()[0]);
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(document.activeElement).toBe(buttons()[buttons().length - 1]);
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it("stars a focused flag with S and lists it in the starred row", () => {
    render(<FlagsBrowser tiles={tiles} />);
    const first = document.querySelector<HTMLElement>("[data-flag-button]")!;
    first.focus();
    fireEvent.keyDown(first, { key: "s" });
    expect(screen.getByRole("region", { name: "Starred" })).toBeTruthy();
  });
});

describe("Your flag card", () => {
  it.each([
    [["de"], "Germany"],
    [["pt-BR"], "Brazil"],
    [["ja"], "Japan"],
    [["en-US"], "United States"],
  ])("detects %s", async (langs, name) => {
    setLanguages(langs);
    render(<FlagsBrowser tiles={tiles} />);
    expect((await screen.findByTestId("your-flag")).textContent).toContain(`Your flag: ${name}`);
  });

  it("skips unknown languages and picks the first that maps", () => {
    expect(detectFlag(["xx", "fr-CA"], tiles)?.code).toBe("ca");
    expect(detectFlag(["xx"], tiles)).toBeUndefined();
  });
});

describe("Flags for languages", () => {
  it("lists the mapped locales with the native language name beside a decorative flag", async () => {
    render(<FlagsBrowser tiles={tiles} />);
    fireEvent.click(screen.getByRole("tab", { name: "Flags for languages" }));
    const list = await screen.findByTestId("language-list");
    expect(within(list).getAllByRole("listitem").length).toBeGreaterThanOrEqual(20);
    expect(list.textContent).toContain("Deutsch");
    expect(list.textContent).toContain("español");
    for (const img of list.querySelectorAll("img")) expect(img.getAttribute("alt")).toBe("");
    expect(screen.getAllByText(/not a language/i).length).toBeGreaterThan(0);
    expect(nativeLanguageName("ja")).toBe("日本語");
  });
});
