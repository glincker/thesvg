/**
 * Reserved words (plus the strict-mode restricted bindings `arguments` and
 * `eval`) that are illegal as a binding name in ES module code. A slug like
 * "await" would otherwise emit `const await = ...`, which is a syntax error
 * and breaks the whole package build (and any consumer's type-check).
 *
 * ES modules are always strict-mode, so the strict-mode reserved set applies
 * here in full.
 */
export const RESERVED_IDENTIFIERS = new Set([
  // ECMAScript reserved words
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  // Strict-mode restricted bindings (modules are strict)
  "arguments",
  "eval",
]);

/**
 * Turn a slug into a valid JS identifier.
 * Slugs can start with digits (e.g. "01dotai") or contain hyphens/dots.
 * Strategy: prefix with "i_" if it starts with a digit or is a reserved word,
 * replace non-word chars with "_".
 */
export function toSafeIdentifier(slug: string): string {
  let id = slug.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(id) || RESERVED_IDENTIFIERS.has(id)) id = `i_${id}`;
  return id;
}
