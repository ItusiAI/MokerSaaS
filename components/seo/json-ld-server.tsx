/**
 * Server-rendered JSON-LD structured data.
 *
 * Emits a real <script type="application/ld+json"> tag inside the SSR HTML so
 * crawlers that don't execute JavaScript can still discover the structured
 * data (unlike the client-only JsonLd component, which appends the script
 * after hydration).
 *
 * The `<` characters are escaped to prevent premature script termination
 * when the JSON contains literal `<` (e.g. inside strings).
 */
export function JsonLdServer({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}