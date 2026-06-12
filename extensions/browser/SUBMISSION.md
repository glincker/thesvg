# Store Submission Checklist - thesvg Browser Extension

## Pre-Submission (All Stores)

- [ ] `pnpm zip:all` produces three clean zips in `.output/`
- [ ] Verify zip filenames: `thesvg-browser-extension-0.1.0-chrome.zip`, `-firefox.zip`, `-edge.zip`
- [ ] All three icon sizes exist: `public/icon/16.png`, `48.png`, `128.png`
- [ ] Manifest `version` in `wxt.config.ts` matches the version you intend to publish
- [ ] Privacy policy is live at `https://thesvg.org/privacy`
- [ ] Screenshots ready (see `SCREENSHOTS.md`): at minimum `screenshot-01-search.png` and one more
- [ ] Store listing copy ready (see `STORE_LISTING.md`)
- [ ] Per-permission justification text prepared (see STORE_LISTING.md)

---

## Recommended Submission Order

Submit Firefox first -- AMO review is the slowest (1-7 days for new extensions). Chrome and Edge can be submitted in parallel after Firefox is in review.

1. Firefox AMO
2. Chrome Web Store (submit same day as Firefox)
3. Microsoft Edge Add-ons (submit same day, accepts Chrome zip directly)

---

## 1. Firefox Add-ons (AMO)

**Cost:** Free
**Review time:** 1-7 days for initial submission (automated checks are instant; human review is manual queue)
**URL:** https://addons.mozilla.org/developers/

### Account setup
- [ ] Create Firefox account at https://accounts.firefox.com if you do not have one
- [ ] Visit https://addons.mozilla.org/developers/ and accept developer agreement

### Submission steps
- [ ] Click "Submit a New Add-on"
- [ ] Choose "On this site" (hosted on AMO)
- [ ] Upload `thesvg-browser-extension-0.1.0-firefox.zip`
- [ ] AMO will also request the **sources zip** (`thesvg-browser-extension-0.1.0-sources.zip`) -- WXT generates this automatically alongside the Firefox zip. Upload it when prompted.
- [ ] Fill in listing details:
  - Name: `theSVG`
  - Short description: use the 199-char version from STORE_LISTING.md
  - Full description: use Firefox version from STORE_LISTING.md
  - Category: Web Development
  - Tags: `svg`, `icons`, `brand`, `developer-tools`, `open-source`
- [ ] Add screenshots (see SCREENSHOTS.md)
- [ ] Privacy policy URL: `https://thesvg.org/privacy`
- [ ] Leave "This add-on requires payment" unchecked
- [ ] Submit for review

### AMO-specific notes
- The sources zip is required for AMO to audit the build process. The auto-generated `pnpm build:firefox` + the lockfile should be sufficient for reviewers to reproduce the build.
- AMO reviewers scrutinize `host_permissions`. Be ready to explain that `https://cdn.jsdelivr.net/*` is used exclusively to fetch public SVG assets on demand, not for analytics or tracking. The justification text in STORE_LISTING.md covers this.
- AMO generates a unique extension ID after first review. Save it -- you will need it in `wxt.config.ts` for future updates to ensure consistent updates.

---

## 2. Chrome Web Store

**Cost:** $5 one-time developer registration fee (paid once, covers all extensions you publish)
**Review time:** 1-3 business days for new extensions
**URL:** https://chrome.google.com/webstore/devconsole

### Account setup
- [ ] Sign in with a Google account at https://chrome.google.com/webstore/devconsole
- [ ] Pay the $5 developer registration fee (one-time, per Google account)

### Submission steps
- [ ] Click "New Item"
- [ ] Upload `thesvg-browser-extension-0.1.0-chrome.zip`
- [ ] Fill in listing details:
  - Name: `theSVG`
  - Short description (132 chars max): use version from STORE_LISTING.md
  - Detailed description: use Chrome/Edge version from STORE_LISTING.md
  - Category: Developer Tools
  - Language: English (United States)
- [ ] Add screenshots (at least 1, recommend all 4 from SCREENSHOTS.md)
- [ ] Add store icon (128x128 PNG -- this is separate from the manifest icon; it is shown in the store listing thumbnail)
- [ ] Privacy tab:
  - Single purpose: "Search and copy brand SVG icons"
  - Permissions justification: fill in all three entries using STORE_LISTING.md text for `storage`, `clipboardWrite`, and `host_permissions`
  - Privacy policy URL: `https://thesvg.org/privacy`
  - Data usage: check "This extension does not collect or use user data"
- [ ] Pricing: Free
- [ ] Visibility: Public
- [ ] Submit for review

### Chrome-specific notes
- Chrome reviewers increasingly flag extensions that request broad host permissions. The `cdn.jsdelivr.net/*` scope is narrow and specific -- the justification should emphasize "public CDN, SVG files only, no user data in the request".
- If the review comes back with a policy violation flag, check the Chrome Extensions policy page and respond within 14 days.
- Chrome requires a 128x128 store icon (not the extension icon). Use the thesvg mark at 128px on a neutral or transparent background.

---

## 3. Microsoft Edge Add-ons

**Cost:** Free
**Review time:** 1-5 business days
**URL:** https://partner.microsoft.com/dashboard/microsoftedge/overview

### Account setup
- [ ] Sign in with a Microsoft account at https://partner.microsoft.com
- [ ] If first time, register as an Edge extension developer (free, just requires accepting the developer agreement)

### Submission steps
- [ ] Click "Create new extension"
- [ ] Upload `thesvg-browser-extension-0.1.0-edge.zip` (the `-chrome.zip` is also accepted, they are identical for MV3)
- [ ] Fill in listing details:
  - Extension name: `theSVG`
  - Short description: use Chrome version from STORE_LISTING.md
  - Detailed description: use Chrome/Edge version from STORE_LISTING.md
  - Category: Developer Tools
  - Language: en-US
- [ ] Add screenshots (same as Chrome, 1366x768 preferred; 1280x800 is accepted)
- [ ] Privacy policy URL: `https://thesvg.org/privacy`
  - Edge requires checking "My extension does not collect user data"
- [ ] Pricing: Free
- [ ] Age rating: General (no adult content, no violence)
- [ ] Submit for review

### Edge-specific notes
- Edge Add-ons accepts Chrome MV3 zips directly without modification. The `-edge.zip` from WXT is included for completeness and is the same content as the Chrome zip.
- Edge review is generally faster than Chrome for first-time submissions.
- Edge does not require a separate store icon -- it uses the 128px icon from the manifest.

---

## Post-Submission Tracking

| Store | Status | Submission Date | Live Date | Store URL |
|---|---|---|---|---|
| Firefox AMO | Not submitted | -- | -- | -- |
| Chrome Web Store | Not submitted | -- | -- | -- |
| Edge Add-ons | Not submitted | -- | -- | -- |

---

## Version Bump Checklist (Future Updates)

- [ ] Update `version` in `extensions/browser/wxt.config.ts`
- [ ] Update `version` in `extensions/browser/package.json`
- [ ] Run `pnpm zip:all` to produce new zips
- [ ] For AMO: upload new zip, add release notes
- [ ] For Chrome: upload new zip in developer console, describe changes in "What's new"
- [ ] For Edge: upload new zip in partner dashboard
