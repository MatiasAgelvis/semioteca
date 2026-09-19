/**
 * Rewrite <sup>N</sup> tags into anchor links pointing to footnote entries.
 *
 * Used in the book view where `Book.footnotes` provides the footnote text.
 * Only rewrites superscripts whose number exists in the footnotes dict.
 */
export function linkFootnotes(html: string, footnotes: Record<string, string>): string {
  if (!footnotes || Object.keys(footnotes).length === 0) return html;

  return html.replace(/<sup>(\d+)<\/sup>/g, (_match, num: string) => {
    if (num in footnotes) {
      return `<a href="#fn-${num}" class="link link-primary no-underline hover:underline"><sup>${num}</sup></a>`;
    }
    return `<sup>${num}</sup>`;
  });
}
