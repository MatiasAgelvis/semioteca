/**
 * HTML utilities for card content.
 *
 * Card content is stored with inline formatting tags (<em>, <strong>, <sup>,
 * <sub>) preserved from the source ODTs.  These utilities handle the two
 * common operations on that content:
 *
 *  - **stripHtml**: remove all tags → plain text (search, excerpts, exports)
 *  - **sanitizeHtml**: keep only the allowed tags → safe for {@html} rendering
 */

/** Tags preserved by the backend extractor and allowed in card content. */
const ALLOWED_TAGS = new Set(['em', 'strong', 'sup', 'sub']);

/**
 * Strip all HTML tags from *html* and return plain text.
 *
 * Used by search, excerpt, citation, and export utilities where formatting
 * is irrelevant and raw text is needed.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

/**
 * Keep only the allowed inline tags (<em>, <strong>, <sup>, <sub>) and strip
 * everything else.  Renders safely inside Svelte's `{@html}` directive.
 *
 * This is a belt-and-suspenders guard: the backend already restricts the tag
 * set, but this ensures no unexpected markup leaks through.
 */
export function sanitizeHtml(html: string): string {
  return html.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const lower = tag.toLowerCase();
    return ALLOWED_TAGS.has(lower) ? match : '';
  });
}

/**
 * Convert HTML with allowed inline tags to a pdfmake text array.
 *
 * pdfmake renders arrays of text objects with per-object styling:
 * ``{ text: [ { text: 'italic', italics: true }, ' normal' ] }``
 *
 * This function parses our restricted HTML subset into that structure.
 * Unknown tags are stripped; `<br>` becomes a newline.
 */
export interface PdfmakeTextSpan {
  text: string;
  bold?: boolean;
  italics?: boolean;
  fontSize?: number; // relative sizing for sup/sub
  superScript?: boolean;
  subScript?: boolean;
}

export function htmlToPdfmake(html: string): PdfmakeTextSpan[] {
  const spans: PdfmakeTextSpan[] = [];
  let current: PdfmakeTextSpan = { text: '' };
  const stack: string[] = [];

  const flush = () => {
    if (current.text) spans.push(current);
    current = { text: '' };
  };

  const tagRe = /<\/?(em|strong|sup|sub|br)\b[^>]*\/?>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(html)) !== null) {
    // Text before this tag
    if (m.index > lastIndex) {
      current.text += html.slice(lastIndex, m.index);
    }
    lastIndex = tagRe.lastIndex;

    const raw = m[0];
    const isClosing = raw[1] === '/';
    const tagName = m[1].toLowerCase();

    if (tagName === 'br') {
      flush();
      spans.push({ text: '\n' });
      continue;
    }

    if (isClosing) {
      // Pop from stack and apply formatting to current span
      flush();
      stack.pop();
      // Rebuild formatting from remaining stack
      current = { text: '', ...stackToStyle(stack) };
    } else {
      // Push tag and start a new formatted span
      flush();
      stack.push(tagName);
      current = { text: '', ...stackToStyle(stack) };
    }
  }

  // Remaining text after last tag
  if (lastIndex < html.length) {
    current.text += html.slice(lastIndex);
  }
  flush();

  return spans;
}

function stackToStyle(
  stack: string[],
): Pick<PdfmakeTextSpan, 'bold' | 'italics' | 'superScript' | 'subScript'> {
  const style: Pick<PdfmakeTextSpan, 'bold' | 'italics' | 'superScript' | 'subScript'> = {};
  for (const tag of stack) {
    if (tag === 'strong') style.bold = true;
    else if (tag === 'em') style.italics = true;
    else if (tag === 'sup') style.superScript = true;
    else if (tag === 'sub') style.subScript = true;
  }
  return style;
}

/**
 * Convert HTML with allowed inline tags to Markdown.
 *
 * ``<em>x</em>`` → ``*x*``, ``<strong>x</strong>`` → ``**x**``,
 * ``<sup>x</sup>`` → ``^x^``, ``<sub>x</sub>`` → ``~x~``.
 * Unknown tags are stripped.
 */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<strong>([^<]*)<\/strong>/gi, '**$1**')
    .replace(/<em>([^<]*)<\/em>/gi, '*$1*')
    .replace(/<sup>([^<]*)<\/sup>/gi, '^$1^')
    .replace(/<sub>([^<]*)<\/sub>/gi, '~$1~')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ''); // strip any remaining tags
}
