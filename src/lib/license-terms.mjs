// Shared by the icon page and the SVGO workflow filter, so both agree on
// which icons may not be rewritten.
const NO_MODIFY =
  /unaltered|unmodified|unchanged official|do not modify|no modification|CC-BY-ND|custom owner permission/i;

/** True when the license forbids altering the artwork (no minifying either). */
export function requiresUnmodifiedSvg(license) {
  return typeof license === "string" && NO_MODIFY.test(license);
}
