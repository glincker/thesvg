// A default colour per icon, so a check reads green and an alert red without the caller choosing. Full class names so Tailwind sees them.
const TONES = {
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  rose: "text-rose-600 dark:text-rose-400",
  orange: "text-orange-600 dark:text-orange-400",
  violet: "text-violet-600 dark:text-violet-400",
  teal: "text-teal-600 dark:text-teal-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
} as const;

// First match wins, so the specific rules sit above the broad ones.
const RULES: [RegExp, keyof typeof TONES][] = [
  [/(^|-)(error|alert|danger|ban|block|bug|skull|trash|delete|x-circle|circle-x|octagon|stop|virus|fire|flame)(-|$)/, "red"],
  [/(^|-)(warning|triangle-alert|caution|flag|bell|lightbulb|idea|lamp)(-|$)/, "amber"],
  [/(^|-)(check|tick|success|verified|done|approve|shield-check|badge-check|thumbs-up|leaf|sprout|recycle|wifi)(-|$)/, "green"],
  [/(^|-)(heart|love|like|gift|cake|party|balloon|lipstick)(-|$)/, "rose"],
  [/(^|-)(star|sun|sparkle|sparkles|zap|bolt|lightning|trophy|crown|medal|coin|coins|bookmark)(-|$)/, "yellow"],
  [/(^|-)(info|help|question|link|mail|message|chat|cloud|water|droplet|wave|share|send|globe|compass|anchor)(-|$)/, "blue"],
  [/(^|-)(bot|brain|wand|magic|robot|agent|atom|orbit|rocket|planet)(-|$)/, "violet"],
  [/(^|-)(folder|file|archive|package|box|home|house|store|shopping|cart|bag|tag|ticket)(-|$)/, "orange"],
  [/(^|-)(code|terminal|git|database|server|cpu|chip|plug|puzzle)(-|$)/, "teal"],
];

/** Default text-colour classes for an icon, or an empty string when it should stay neutral. */
export function defaultColorOf(slug: string): string {
  for (const [re, tone] of RULES) if (re.test(slug)) return TONES[tone];
  return "";
}
