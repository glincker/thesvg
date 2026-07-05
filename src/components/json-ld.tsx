/**
 * Server-rendered JSON-LD script. Escapes `<` to `<` so a value can never
 * break out of the <script> tag (XSS-safe). Rendered as a plain server
 * component so the structured data is emitted into the static HTML.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
