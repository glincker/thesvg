/**
 * Global UTM-parameter embedder for outbound links.
 *
 * Every external link on thesvg.org should carry UTM params so:
 *   - brand/partner sites can attribute referral traffic back to thesvg.org
 *   - thesvg's own analytics can distinguish which page/section drove a
 *     given outbound click (via the `source` -> utm_campaign mapping)
 */

/**
 * Appends thesvg's standard UTM parameters to an external URL.
 *
 * @param url The href to wrap. Internal/relative URLs and `mailto:` links
 *   are returned unchanged so callers can call this unconditionally
 *   without special-casing non-http(s) hrefs.
 * @param source Identifies which page/section the link lives in (e.g.
 *   "footer", "header", "icon_detail"). Used as the default utm_campaign.
 * @param overrides Optional overrides for utm_medium / utm_campaign.
 */
export function withUtm(
  url: string,
  source: string,
  overrides?: { medium?: string; campaign?: string }
): string {
  // No-op for mailto: links - UTM params on a mailto have no meaning.
  if (url.startsWith("mailto:")) {
    return url;
  }

  // No-op for internal/relative links - only fully-qualified http(s) URLs
  // are "external" and worth attributing.
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Not a parseable absolute URL - return as-is rather than throw.
    return url;
  }

  // Safety rule: if the URL already carries ANY utm_ query parameter,
  // leave it completely untouched. Some outbound links (e.g. a Product
  // Hunt badge URL) already carry the PARTNER's own UTM params for their
  // own attribution. Overriding or merging with those would clobber the
  // partner's tracking, not ours - so we deliberately skip injection
  // entirely rather than trying to merge/override individual params.
  for (const key of parsed.searchParams.keys()) {
    if (key.startsWith("utm_")) {
      return url;
    }
  }

  parsed.searchParams.set("utm_source", "thesvg.org");
  parsed.searchParams.set("utm_medium", overrides?.medium ?? "referral");
  parsed.searchParams.set("utm_campaign", overrides?.campaign ?? source);

  return parsed.toString();
}
