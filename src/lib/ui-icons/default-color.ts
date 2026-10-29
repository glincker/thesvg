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

// Network marks keep their own colour. Neutral ones (GitHub, X, CodePen) follow the text colour.
const SOCIAL: Record<string, string> = {
  "social-gitlab": "text-[#FC6D26]",
  "social-linkedin": "text-[#0A66C2]",
  "social-facebook": "text-[#1877F2]",
  "social-instagram": "text-[#E4405F]",
  "social-youtube": "text-[#FF0000]",
  "social-discord": "text-[#5865F2]",
  "social-reddit": "text-[#FF4500]",
  "social-mastodon": "text-[#6364FF]",
  "social-bluesky": "text-[#0085FF]",
  "social-twitch": "text-[#9146FF]",
  "social-tiktok": "text-[#FE2C55]",
  "social-whatsapp": "text-[#25D366]",
  "social-telegram": "text-[#26A5E4]",
  "social-slack": "text-[#E01E5A]",
  "social-npm": "text-[#CB3837]",
  "social-stackoverflow": "text-[#F48024]",
  "social-pinterest": "text-[#E60023]",
  "social-snapchat": "text-[#F5B700]",
  "social-spotify": "text-[#1DB954]",
  "social-dribbble": "text-[#EA4C89]",
  "social-behance": "text-[#1769FF]",
  "social-vimeo": "text-[#1AB7EA]",
  "social-patreon": "text-[#FF424D]",
  "social-product-hunt": "text-[#DA552F]",
  "social-hacker-news": "text-[#FF6600]",
  "social-substack": "text-[#FF6719]",
  "social-signal": "text-[#3A76F0]",
  "social-wechat": "text-[#07C160]",
  "social-line": "text-[#06C755]",
  "social-kick": "text-[#53C51A]",
  "social-thesvg": "text-[#F97316]",
};

// First match wins, so the specific rules sit above the broad ones.
const RULES: [RegExp, keyof typeof TONES][] = [
  [/^(repost|share-sheet|invite-friend-link)$/, "green"],
  [/^(reply-everyone|dm|hashtag|mention-bubble|group-chat|follow-back|unfollow|verified-seal)$/, "blue"],
  [/^(live-stream|trending-up-fire)$/, "red"],
  [/^(quote-post|podcast-show|story-ring)$/, "violet"],
  [/^(emoji-react|pinned-post|report-flag)$/, "amber"],
  [/^newsletter-issue$/, "orange"],
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
  if (slug.startsWith("social-")) return SOCIAL[slug] ?? "";
  for (const [re, tone] of RULES) if (re.test(slug)) return TONES[tone];
  return "";
}
