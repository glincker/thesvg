# Privacy Policy - thesvg Browser Extension

**Effective date:** 2026-06-12
**Applies to:** thesvg browser extension for Chrome, Firefox, and Edge
**Hosted at:** https://thesvg.org/privacy (canonical URL for store submissions)

---

## Summary

The thesvg browser extension collects no personal data. It does not track you, does not phone home, and does not share anything with anyone.

---

## What the extension does

The thesvg extension lets you search and copy brand SVG icons directly from your browser toolbar. When you open the popup, you can search for a brand by name, preview icon variants, and copy the SVG code, a CDN URL, or a markdown snippet to your clipboard.

---

## Data collected

**None.** The extension does not collect, store remotely, or transmit any personally identifiable information.

---

## Local storage

The extension uses the browser's built-in `storage.local` API to save:

- Your recently viewed icons (stored as icon slugs, e.g. `"github"`)
- Your preferred copy format (SVG / CDN URL / Markdown)
- Your preferred display mode if you toggle light or dark

This data lives only in your browser's local storage on your device. It is never synced to any server, never included in any network request, and is deleted when you uninstall the extension.

---

## Network requests

The extension fetches SVG files from the jsDelivr public CDN (`https://cdn.jsdelivr.net/`) when you preview or copy an icon. This is a standard public HTTP request to retrieve a publicly available file. No cookies, authentication tokens, or user identifiers are included in these requests. jsDelivr's own privacy policy applies to requests made to their CDN: https://www.jsdelivr.com/privacy-policy-jsdelivr-net

The extension makes no other network requests.

---

## Clipboard access

The extension uses the browser `clipboardWrite` permission to copy content to your clipboard when you click a copy button. The extension never reads from your clipboard.

---

## Analytics and tracking

None. The extension contains no analytics SDK, no error reporting service, no tracking pixels, and no remote logging.

---

## Remote code

None. All extension logic is bundled locally and reviewed as part of the open-source codebase at https://github.com/GLINCKER/thesvg. The extension does not load or execute any code from remote servers.

---

## Third-party services

The only third-party service the extension interacts with is the jsDelivr CDN for fetching SVG files, as described above.

---

## Children's privacy

The extension is a developer tool and is not directed at children under 13. It collects no data from any user.

---

## Changes to this policy

If this policy changes materially, the updated version will be published at https://thesvg.org/privacy and the extension listing will be updated accordingly.

---

## Contact

Questions about privacy: support@glincker.com
