interface JsonLdProps {
  data: Record<string, unknown>
}

/**
 * Renders a JSON-LD structured data block as a
 * <script type="application/ld+json"> tag inside the document.
 *
 * Place it where you want the structured data to appear in the HTML.
 * The `<` characters are escaped to prevent premature script termination.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}