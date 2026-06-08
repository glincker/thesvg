# Icon Licensing Guide

How licensing works on **thesvg.org**, what you promise when you submit, and what we promise when we publish. Plain language, with sources you can verify.

> **Not legal advice.** This document explains how we operate. If the brand you're submitting belongs to someone else and you're unsure about your rights, talk to a lawyer or the brand owner before submitting. See [DISCLAIMER.md](./DISCLAIMER.md) for the full project disclaimer.

## Table of contents

1. [License vs. trademark — read this first](#1-license-vs-trademark--read-this-first)
2. [What you promise when you submit](#2-what-you-promise-when-you-submit)
3. [What we promise when we publish](#3-what-we-promise-when-we-publish)
4. [Pick a license by question](#4-pick-a-license-by-question)
5. [The licenses we accept](#5-the-licenses-we-accept)
6. [The "Other / custom" path](#6-the-other--custom-path)
7. [What we never accept](#7-what-we-never-accept)
8. [If you find a wrong license — takedown procedure](#8-if-you-find-a-wrong-license--takedown-procedure)

---

## 1. License vs. trademark — read this first

These are two different things, and **both** can apply to a brand icon. Confusing them is the single most common mistake on the submission form.

| | License | Trademark |
|---|---|---|
| **Controls** | Who can copy / modify / redistribute the **SVG file** | Who can use the **brand mark** to identify goods or services |
| **Set by** | The author or publisher of the file | The brand owner, often via national / EU registration |
| **Source of truth** | The `LICENSE` file shipped with the asset | The brand's "Brand Guidelines" or "Trademark Usage Policy" page |
| **Authoritative reference** | [SPDX License List](https://spdx.org/licenses/) | [USPTO Trademark Basics](https://www.uspto.gov/trademarks/basics), [EUIPO Trademark Basics](https://euipo.europa.eu/ohimportal/en/trade-marks-in-the-european-union) |

A logo can have a **permissive license** (the SVG is free to copy) **and** still be a **registered trademark** (you can't use it to imply endorsement, sell merchandise, or pass off your product as the brand). All brand marks on thesvg.org are subject to the original owner's trademark rights — see [TRADEMARK.md](./TRADEMARK.md) for our full policy.

**The submission form is only asking about the *license* of the SVG file itself, not whether you have permission to use the brand commercially.**

---

## 2. What you promise when you submit

By picking a license on the form, you're asserting:

1. **You have the right to license this asset.** Either you created it, it's already published under that license by the brand owner, or it's in the public domain.
2. **The license is accurate.** If you pick `MIT`, you're saying the upstream source actually publishes the brand mark under MIT (not just the project's code — many OSS projects have permissive code but restricted brand assets).
3. **You'll respond if we ask follow-up questions.** Especially for the "Other / custom" path, where a maintainer will reach out on the GitHub issue.

If you're unsure about any of these, pick **"Other / custom — needs maintainer review"** and we'll figure it out together before merging. **Picking incorrectly creates legal exposure for both you and us** — that's why the form blocks submission until a license is chosen.

---

## 3. What we promise when we publish

When your icon lands in the registry, we:

1. **Record your declared license verbatim** in the `icons.json` entry. Downstream consumers (apps, packages, jsDelivr, the npm package `@thesvg/icons`) inherit that field as-is. The license is part of the public API.
2. **Surface the license on the icon's detail page** at `thesvg.org/icon/<slug>` so anyone using the icon can see what they're agreeing to.
3. **Promptly remove or relicense an icon** if we discover the declared license is wrong — see [section 8](#8-if-you-find-a-wrong-license--takedown-procedure).
4. **Never relicense your asset more permissively than you declared.** If you submit a CC BY-ND icon, we'll never quietly re-publish it as MIT.

What we **don't** do: We don't audit every submission against the brand owner's trademark policy at intake. We rely on submitters to be honest, on community reports for corrections, and on the [takedown procedure](./LEGAL.md) for disputes. Submitters and downstream users are responsible for trademark compliance — see [TRADEMARK.md](./TRADEMARK.md).

---

## 4. Pick a license by question

### Q1. Did you draw this icon yourself, from scratch, with no copying?

**Pick:** [`CC0 1.0`](https://creativecommons.org/publicdomain/zero/1.0/) (public domain dedication)

You're waiving all rights and letting anyone use it for any purpose. Best for personal projects, generic icons, and brand kits you've designed and want to gift to the community. CC0 is the closest thing to true public domain that's legally enforceable in jurisdictions where you can't "release to public domain" by simple declaration.

### Q2. Is this the official logo of an open-source project?

Look in the project's repository for a `LICENSE` file inside the brand-assets folder — commonly `assets/`, `branding/`, `logo/`, or `media/`. **The project's source code license is not automatically the same as the brand asset license.** Many projects deliberately restrict their brand mark even when the code is permissive.

| What the project says | Pick |
|---|---|
| Brand assets explicitly CC0 / public domain | [`CC0 1.0`](https://creativecommons.org/publicdomain/zero/1.0/) |
| Apache-licensed project, no separate brand policy | [`Apache 2.0`](https://spdx.org/licenses/Apache-2.0.html) |
| MIT-licensed project, no separate brand policy | [`MIT`](https://spdx.org/licenses/MIT.html) |
| BSD-licensed project, no separate brand policy | [`BSD-3-Clause`](https://spdx.org/licenses/BSD-3-Clause.html) |
| ISC-licensed project, no separate brand policy | [`ISC`](https://spdx.org/licenses/ISC.html) |
| MPL 2.0 project (Firefox / Mozilla) | [`MPL-2.0`](https://spdx.org/licenses/MPL-2.0.html) |
| CC BY 4.0 (Creative Commons attribution) | [`CC BY 4.0`](https://creativecommons.org/licenses/by/4.0/) |
| CC BY-SA 4.0 (share-alike, e.g. Wikipedia assets) | [`CC BY-SA 4.0`](https://creativecommons.org/licenses/by-sa/4.0/) |
| CC BY-ND 4.0 (no derivatives — common for corporate kits) | [`CC BY-ND 4.0`](https://creativecommons.org/licenses/by-nd/4.0/) |
| Brand guidelines doc with usage restrictions, no SPDX license | [Other / custom](#6-the-other--custom-path) |

### Q3. Is this a corporate / company brand mark?

**Pick:** [Other / custom](#6-the-other--custom-path)

Most companies don't license their logos under a public open-source license. They publish brand guidelines instead — see for example [Google's Brand Resource Center](https://about.google/brand-resource-center/), [Microsoft's Trademark Usage Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks), or [Apple's Guidelines for Using Apple Trademarks](https://www.apple.com/legal/intellectualproperty/guidelinesfor3rdparties.html). Picking "Other / custom" lets us:

1. Read the linked brand guidelines and verify the usage you're proposing is permitted.
2. Label the issue `license-unsure` so it routes to a maintainer for confirmation.
3. Document the actual policy in the `icons.json` entry instead of pretending it's MIT.

### Q4. Is this a fork / modification of an existing icon?

Same license as the original — most permissive licenses require this (Apache, MPL, all CC licenses). If you can't find the original's license, pick [Other / custom](#6-the-other--custom-path).

---

## 5. The licenses we accept

All ten licenses below are listed in the [SPDX License List](https://spdx.org/licenses/) and most are approved by the [Open Source Initiative](https://opensource.org/licenses/). Links go to the canonical text — read it before picking.

### Public-domain dedications

- **[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)** — "No Rights Reserved." Best legally-enforceable public-domain dedication. ([SPDX](https://spdx.org/licenses/CC0-1.0.html))
- **[The Unlicense](https://unlicense.org/)** — public-domain dedication common in small OSS projects. ([SPDX](https://spdx.org/licenses/Unlicense.html), [OSI-approved](https://opensource.org/license/unlicense))

### Permissive

- **[MIT](https://opensource.org/license/mit)** — short and permissive, attribution only. The most common OSS license. ([SPDX](https://spdx.org/licenses/MIT.html))
- **[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)** — permissive with an explicit patent grant. Common for cloud / infra brands. ([SPDX](https://spdx.org/licenses/Apache-2.0.html), [OSI-approved](https://opensource.org/license/apache-2-0))
- **[BSD 3-Clause](https://opensource.org/license/bsd-3-clause)** — permissive with attribution + no-endorsement clause. ([SPDX](https://spdx.org/licenses/BSD-3-Clause.html))
- **[ISC](https://opensource.org/license/isc-license-txt)** — functionally equivalent to MIT, shorter text. ([SPDX](https://spdx.org/licenses/ISC.html))

### Creative Commons attribution family

The CC family is published by the [Creative Commons](https://creativecommons.org/) non-profit. Each license has a [machine-readable summary](https://creativecommons.org/share-your-work/cclicenses/) and full legal code.

- **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)** — attribution required, otherwise unrestricted. ([SPDX](https://spdx.org/licenses/CC-BY-4.0.html))
- **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)** — attribution + share-alike. Wikipedia uses this for most of its assets. ([SPDX](https://spdx.org/licenses/CC-BY-SA-4.0.html))
- **[CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/)** — attribution, **no derivatives**. Picking this means the logo cannot be modified, only used as-is. Common for corporate brand kits. ([SPDX](https://spdx.org/licenses/CC-BY-ND-4.0.html))

### Weak copyleft

- **[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)** — file-level copyleft. Used by Firefox, Thunderbird, and Mozilla-adjacent projects. ([SPDX](https://spdx.org/licenses/MPL-2.0.html), [OSI-approved](https://opensource.org/license/mpl-2-0))

---

## 6. The "Other / custom" path

Pick **"Other / custom — needs maintainer review"** when any of these apply:

- The asset has a real license, but it's not in the list above (e.g. a custom company brand-usage policy, EPL, AGPL, a CC license we don't pre-stock).
- The brand has published guidelines but no formal SPDX license at all.
- You're not sure and want a maintainer to confirm before merging.

When you pick Other:

1. You'll be prompted for a short description (≤120 chars). Examples:
   - `"Acme Brand Guidelines v2 — non-commercial only"`
   - `"Custom — written permission from owner, see issue thread"`
   - `"EPL-2.0"`
2. The auto-generated GitHub issue is labeled [`license-unsure`](https://github.com/GLINCKER/thesvg/issues?q=label%3Alicense-unsure).
3. A maintainer reviews the source link, the brand guidelines, and the description before merging. They may request more info on the issue thread.
4. If the license is verifiable and acceptable, the asset is merged with the declared text recorded verbatim in `icons.json`.

**This path is not a way to bypass the rules — it's a way to be honest about ambiguity.** A clearly-labeled `license-unsure` submission is much easier to handle than a "yeah, just say MIT" submission that we have to take down later.

---

## 7. What we never accept

- **"All rights reserved"** assets without explicit, documented owner permission. Even if you uploaded it, we can't republish it without rights.
- **Assets where the license forbids redistribution.** Some brand assets are licensed only for internal company use — those can't go into a public registry.
- **Mislabeled licenses.** Submitting a CC BY-ND asset as MIT, for example. This creates legal exposure for you, for us, and for every downstream consumer.
- **Assets you found on the internet with no traceable source.** "I got it from Google Images" is not a license declaration.

---

## 8. If you find a wrong license — takedown procedure

License accuracy is a first-class concern for us. If you spot an icon whose declared license is wrong (e.g. marked MIT when it should be Other / proprietary):

1. **Open an issue** at [github.com/GLINCKER/thesvg/issues](https://github.com/GLINCKER/thesvg/issues/new) titled `[License] <slug> — <what's wrong>`.
2. Include: the icon slug, the declared license in the registry, what you believe the correct license is, and a link to the authoritative source.
3. We aim to respond within 72 hours. For verifiable mistakes we either relicense the entry or remove the asset entirely.

For formal takedown requests from rights-holders or their representatives, see the procedure in [LEGAL.md](./LEGAL.md).

---

## Related policies

- [DISCLAIMER.md](./DISCLAIMER.md) — project disclaimer
- [LEGAL.md](./LEGAL.md) — DMCA / takedown procedure
- [TRADEMARK.md](./TRADEMARK.md) — trademark policy
- [CONTRIBUTING.md](./CONTRIBUTING.md) — general contribution guide
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — community standards
