/**
 * Interface size: an opt-in way to make the whole site one or two steps bigger, for people who would otherwise zoom.
 * It changes the root font size (a percentage of the browser default, so the browser's own setting still applies).
 * Everything sized in rem follows: text, spacing, icons and controls. Text written in fixed pixels does not.
 * The matching CSS lives in src/app/globals.css, a test keeps the two in step.
 */

export type InterfaceSize = "default" | "large" | "larger";

export const INTERFACE_SIZES: { id: InterfaceSize; label: string; description: string; percent: number }[] = [
  { id: "default", label: "Default", description: "The standard size", percent: 100 },
  { id: "large", label: "Large", description: "One step up, about 112%", percent: 112.5 },
  { id: "larger", label: "Larger", description: "Two steps up, 125%", percent: 125 },
];

export const INTERFACE_SIZE_ATTRIBUTE = "data-interface-size";
export const SETTINGS_STORAGE_KEY = "thesvg-settings";

export function parseInterfaceSize(value: unknown): InterfaceSize {
  return INTERFACE_SIZES.some((s) => s.id === value) ? (value as InterfaceSize) : "default";
}

/** Runs in the head before first paint, so a saved size never flashes the default one first. */
export const INTERFACE_SIZE_SCRIPT = `(function(){try{var r=localStorage.getItem(${JSON.stringify(SETTINGS_STORAGE_KEY)});if(!r)return;var s=JSON.parse(r).state;var v=s&&s.interfaceSize;if(${INTERFACE_SIZES.filter((s) => s.id !== "default")
  .map((s) => `v===${JSON.stringify(s.id)}`)
  .join("||")})document.documentElement.setAttribute(${JSON.stringify(INTERFACE_SIZE_ATTRIBUTE)},v)}catch(e){}})()`;
