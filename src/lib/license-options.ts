/**
 * Submission-time license selection.
 *
 * The submit form previously left the license field as a placeholder in
 * the generated issue body, which meant every accepted icon required a
 * maintainer-led round-trip on the issue thread to ask "what license?".
 * Front-loading this choice on the form cuts that round-trip.
 *
 * Kept as a pure module (no React) so the validation logic can be tested
 * with `node --test` without a DOM or component runner.
 */

export interface LicenseOption {
  /** SPDX-like id used in icons.json `license` field. */
  id: string;
  /** Short label shown in the form. */
  label: string;
  /** One-line helper text under the option. */
  description: string;
  /**
   * When true, the auto-generated GitHub issue gets a `license-unsure`
   * label so triage routes it for ownership confirmation before merge.
   * Reserved for the "Other / unsure" branch.
   */
  needsTriage?: boolean;
}

/**
 * The five licenses we routinely accept for icon submissions, plus an
 * explicit "Other / unsure" escape hatch so we don't reject borderline
 * cases — those just get labeled for review instead of merged blindly.
 *
 * Order matters: most common first.
 */
export const LICENSE_OPTIONS: readonly LicenseOption[] = [
  // Public-domain dedications
  {
    id: "CC0-1.0",
    label: "CC0 1.0 (public domain)",
    description: "I made this myself and waive all rights, or it's already public domain.",
  },
  {
    id: "Unlicense",
    label: "The Unlicense (public domain)",
    description: "Public-domain dedication, common for small OSS projects.",
  },
  // Permissive
  {
    id: "MIT",
    label: "MIT",
    description: "Permissive, attribution-only. Common for open-source project logos.",
  },
  {
    id: "Apache-2.0",
    label: "Apache 2.0",
    description: "Permissive with explicit patent grant. Common for cloud / infra brands.",
  },
  {
    id: "BSD-3-Clause",
    label: "BSD 3-Clause",
    description: "Permissive, attribution + no-endorsement clause.",
  },
  {
    id: "ISC",
    label: "ISC",
    description: "Permissive, functionally equivalent to MIT.",
  },
  // Creative Commons attribution family
  {
    id: "CC-BY-4.0",
    label: "CC BY 4.0",
    description: "Attribution required. Common for community brand kits.",
  },
  {
    id: "CC-BY-SA-4.0",
    label: "CC BY-SA 4.0",
    description: "Attribution + share-alike. Wikipedia-style.",
  },
  {
    id: "CC-BY-ND-4.0",
    label: "CC BY-ND 4.0",
    description: "Attribution, no derivatives. Common for corporate brand kits where the logo can't be modified.",
  },
  // Weak copyleft
  {
    id: "MPL-2.0",
    label: "Mozilla Public License 2.0",
    description: "File-level copyleft. Used by Mozilla and some adjacent projects.",
  },
  // Free-text escape hatch
  {
    id: "Other",
    label: "Other / custom — needs maintainer review",
    description: "Pick this for company brand marks, custom licenses, or anything you can't confirm. We'll verify before merging.",
    needsTriage: true,
  },
] as const;

const OPTIONS_BY_ID = new Map(LICENSE_OPTIONS.map((o) => [o.id, o]));

/** The id sentinel that requires a free-text description. */
export const OTHER_LICENSE_ID = "Other";

/** Hard cap on the free-text "other" description to keep issue bodies sane. */
export const MAX_OTHER_LICENSE_LENGTH = 120;

export type LicenseValidation =
  | { ok: true; resolved: string; needsTriage: boolean }
  | { ok: false; reason: "missing" | "unknown" | "other_empty" | "other_too_long" };

/**
 * Validate a (licenseId, otherText) pair. Returns the string that should
 * land in icons.json `license`, plus a flag for whether the submission
 * needs maintainer license review.
 *
 * Pure — call from React, call from a test, call from a script.
 */
export function validateLicenseSelection(
  licenseId: string,
  otherText: string,
): LicenseValidation {
  if (typeof licenseId !== "string" || licenseId.trim() === "") {
    return { ok: false, reason: "missing" };
  }
  const option = OPTIONS_BY_ID.get(licenseId);
  if (!option) {
    return { ok: false, reason: "unknown" };
  }
  if (option.id === OTHER_LICENSE_ID) {
    const trimmed = (otherText ?? "").trim();
    if (trimmed.length === 0) {
      return { ok: false, reason: "other_empty" };
    }
    if (trimmed.length > MAX_OTHER_LICENSE_LENGTH) {
      return { ok: false, reason: "other_too_long" };
    }
    return { ok: true, resolved: trimmed, needsTriage: true };
  }
  return { ok: true, resolved: option.id, needsTriage: false };
}
