import { type StyleParams, type Variant, DEFAULT_STYLE } from "@/lib/ui-icons/engine";

// Pure helpers with no icon data, so the build script and the app can both import them.

const CATEGORY_RULES: [string, RegExp][] = [
  ["Space", /^(orbit|satellite|antenna|telemetry|thruster|gripper|radar-sweep|waypoint)/],
  ["Arrows", /^(arrow|chevron|corner|move|undo|redo|rotate|refresh|external|expand|shrink|maximize|minimize|log-|import|export|repeat|shuffle)/],
  ["Status", /(alert|^check|circle-x|^x$|info|^ban|loader|help|question|badge|octagon|flag|bell|siren|hourglass|spinner)/],
  ["Charts", /(chart|trending|gauge|activity|pulse|bar-|pie|signal|radar)/],
  ["Security", /(shield|lock|key|fingerprint|eye|scan|passkey|vault|incognito|id-card)/],
  ["Files", /(^file|folder|archive|clipboard|^book|copy|^save|download|upload|paperclip|notebook|scroll|newspaper|sticky|receipt|library)/],
  ["Communication", /(mail|message|chat|send|phone|share|megaphone|inbox|at-sign|rss|podcast|radio|voicemail)/],
  ["Dev", /(code|terminal|git|database|server|bug|brain|cpu|plug|webhook|binary|package|cloud|network|bot|braces|brackets|component|container|blocks|hard-drive|regex|cable|workflow)/],
  ["Commerce", /(cart|credit|dollar|coins|wallet|^tag|store|shopping|bank|banknote|gift|percent|ticket|piggy|crown|euro|pound)/],
  ["Media", /(image|camera|video|music|^mic|play|pause|volume|film|palette|brush|clapper|headphones|speaker|aperture|photo|disc|tv)/],
  ["People", /(user|contact|person|smile|frown|hand|thumbs|baby|accessibility|heart-handshake|handshake)/],
  ["Layout", /(layout|grid|panel|sidebar|columns|rows|table|align|kanban|split|frame|section|dock|window|app-window|menu|list|ellipsis)/],
  ["Time", /(clock|calendar|timer|alarm|history|watch|hourglass|schedule)/],
  ["Tools", /(wrench|hammer|settings|sliders|funnel|filter|scissors|pencil|pen|eraser|ruler|toggle|cog|tool|screwdriver|magnet|search|zoom|scan)/],
  ["Nature", /(sun|moon|star|cloud|flame|leaf|tree|snow|wind|rain|droplet|mountain|globe|earth|flower|sprout|rocket|zap|bolt|sparkle|umbrella|thermometer)/],
  ["Devices", /(monitor|smartphone|laptop|tablet|keyboard|mouse|printer|battery|wifi|bluetooth|usb|gamepad|watch|router|server-)/],
  ["Shapes", /(circle|square|triangle|diamond|hexagon|octagon|pentagon|shapes|target|dot|box|cube|infinity)/],
  ["Home", /(house|home|building|door|bed|sofa|lamp|bath|map|compass|pin|navigation|route|signpost|landmark|hotel|school|church|factory|warehouse)/],
  ["Interface", /(plus|minus|heart|bookmark|link|trash|edit|more|power|lightbulb|bolt|lightning|command|option|focus|crosshair|pin)/],
];

// A slug is words joined by dashes. A rule must start at the beginning of a word, so "lock" does not match "clock",
// "rain" does not match "brain" and "phone" does not match "smartphone". Rules already anchored with ^ stay as they are.
const anchored = (re: RegExp): RegExp => (re.source.startsWith("^") ? re : new RegExp(`(?:^|-)${re.source}`, re.flags));
const ANCHORED_RULES: [string, RegExp][] = CATEGORY_RULES.map(([name, re]) => [name, anchored(re)]);

export function categoryOf(slug: string): string {
  return ANCHORED_RULES.find(([, re]) => re.test(slug))?.[0] ?? "General";
}


export const VARIANTS = ["outline", "glass", "duotone", "offset", "fill", "pixel", "depth"] as const satisfies readonly Variant[];

const SIGNATURE: Partial<StyleParams> = {
  corner: "chamfer", radius: 1.5, strokeWidth: 1.75, join: "miter", cap: "butt", cutTerminals: true, scale: 0.92,
};
const DEPTH: Partial<StyleParams> = { corner: "chamfer", radius: 1.5, strokeWidth: 1.75, join: "miter", cap: "butt", scale: 0.88, depth: 1.8 };
const FROST: Partial<StyleParams> = { corner: "round", radius: 4, strokeWidth: 1.5, glassDepth: 0.55 };

/** One house style per variant. Glass gets its own, it needs rounder shapes to read as a pane. */
export function styleFor(variant: Variant, lab: Partial<StyleParams> = {}): StyleParams {
  return { ...DEFAULT_STYLE, ...(variant === "glass" ? FROST : variant === "depth" ? DEPTH : SIGNATURE), ...lab };
}


