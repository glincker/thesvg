# Icon Licensing Guide

This guide walks you through picking the right license when you submit an icon to thesvg.org. Every accepted icon has a `license` field in its `icons.json` entry, and the submit form now requires you to pick one upfront so we don't have to chase you on the issue thread.

If after reading this you're still not sure, pick **"Other / unsure — needs maintainer review"**. We'll verify and label your submission for triage.

---

## Important: license vs. trademark

These are two different things and both apply to brand icons:

- **License** controls who can copy and modify the SVG file.
- **Trademark** controls who can use the logo to represent a brand.

A logo can have a permissive license (the SVG is free to copy) **and** still be a registered trademark (you can't use it to imply endorsement). All brand marks on thesvg.org are subject to the original owner's trademark rights — see [TRADEMARK.md](./TRADEMARK.md) for the full policy.

The form is only asking about the **license** of the SVG file itself, not whether you have permission to use the brand.

---

## Pick by question

### Did you draw this icon yourself, from scratch, with no copying?
**Pick:** `CC0 1.0 (public domain)`

You're waiving all rights and letting anyone use it for any purpose. Best for personal projects, generic icons, and brand kits you've designed and want to gift to the community.

### Is this the official logo of an open-source project?
**Check the project's repo for a LICENSE file in the brand assets folder** (often `assets/`, `branding/`, or `logo/`). Common cases:

| What the project says | Pick |
|---|---|
| Their brand assets are CC0 or public domain | `CC0 1.0` |
| Apache-licensed project, no separate brand policy | `Apache 2.0` |
| MIT-licensed project, no separate brand policy | `MIT` |
| CC BY (Creative Commons attribution) | `CC BY 4.0` |
| CC BY-SA (share-alike, e.g. Wikipedia assets) | `CC BY-SA 4.0` |
| They have a "brand guidelines" doc with usage restrictions | `Other / unsure` |

### Is this a corporate / company brand mark?
**Pick:** `Other / unsure — needs maintainer review`

Most companies don't license their logos under a public open-source license — they just publish brand guidelines (e.g. "Don't change the colors, don't put it on top of other logos"). Picking "Other" lets us:

1. Verify the brand guidelines URL you provide actually permits the usage.
2. Label the issue `license-unsure` so it routes correctly.
3. Document the restriction in the `icons.json` entry instead of pretending it's MIT.

### Is this a fork / modification of an existing icon?
Same license as the original. If the original is MIT, your modification stays MIT. If you can't find the original's license, pick `Other / unsure`.

---

## What we accept

The form lists the licenses we accept routinely:

**Public-domain dedications**
- **CC0 1.0** — no rights reserved
- **The Unlicense** — public-domain dedication, common for small OSS projects

**Permissive**
- **MIT** — attribution only
- **Apache 2.0** — permissive with explicit patent grant
- **BSD 3-Clause** — attribution + no-endorsement clause
- **ISC** — functionally equivalent to MIT

**Creative Commons attribution family**
- **CC BY 4.0** — attribution required
- **CC BY-SA 4.0** — attribution + share-alike (Wikipedia-style)
- **CC BY-ND 4.0** — attribution, no derivatives (common for corporate brand kits)

**Weak copyleft**
- **Mozilla Public License 2.0** — file-level copyleft

**Other / custom — needs maintainer review**
Pick this when:
- The license doesn't match any option above (e.g. a custom company brand-usage license).
- The brand has guidelines but no formal SPDX license.
- You're not sure and want a maintainer to confirm.

You'll be prompted for a short description (e.g. "Acme Brand Guidelines v2 — non-commercial use only"). We do **not** accept proprietary "all rights reserved" submissions without explicit owner permission.

---

## What happens after you submit

- **Permissive license (CC0 / MIT / Apache / CC BY / CC BY-SA):** the SVG is added to the registry with that license recorded.
- **Other / unsure:** the GitHub issue is auto-labeled `license-unsure`, and a maintainer reviews ownership / permission before merging. You'll see a comment on the issue if we need anything else from you.

---

## Reporting an incorrect license

If you find an icon in the registry whose license is wrong (e.g. tagged MIT but should be Other), please open an issue with the slug and what you believe the correct license is. We treat license accuracy as a first-class concern — see [LEGAL.md](./LEGAL.md) for takedown procedure.
