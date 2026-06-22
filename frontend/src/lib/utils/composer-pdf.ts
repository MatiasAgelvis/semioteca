import type { TDocumentDefinitions, Content, ContentText, ContentImage } from 'pdfmake/interfaces';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { CardRecord, CardImage } from '$lib/types/content';
import type { ComposerDocument } from '$lib/types/composer';

// Initialize pdfmake with bundled fonts (Roboto)
(pdfMake as any).vfs = pdfFonts;

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function resolveImageUrl(image: CardImage): string {
  const idx = image.path.indexOf('cards_images/');
  if (idx === -1) return '';
  const relative = `/content/${image.path.slice(idx)}`;
  // pdfmake needs absolute URLs for remote images
  if (typeof window !== 'undefined') {
    return new URL(relative, window.location.origin).href;
  }
  return relative;
}

function cardToContent(
  card: CardRecord,
  index: number,
): Content[] {
  const content: Content[] = [];

  const author = normalizeSpace(card.author || 'Autor desconocido');
  const book = normalizeSpace(card.book || 'Sin título');
  const year = normalizeSpace(card.year || 's.f.');
  const page = normalizeSpace(card.page || 's.p.');

  // Card heading with page break before (except first card)
  content.push({
    text: `${index + 1}. ${author} — ${book} (${year}), p. ${page}`,
    style: 'cardHeading',
    pageBreak: index === 0 ? undefined : 'before',
  } as ContentText);

  // Tags
  const tags = card.tags?.filter((t) => t.trim().length > 0) ?? [];
  if (tags.length > 0) {
    content.push({
      text: `Tags: ${tags.join(', ')}`,
      style: 'tags',
      margin: [0, 4, 0, 4],
    } as ContentText);
  }

  // Parse card content: split into text chunks and image placeholders
  const imageMap = new Map(card.images.map((img) => [img.placeholder_id, img]));
  const chunks = card.content.split(/\[\[IMAGE:(\d+)\]\]/g);

  for (let i = 0; i < chunks.length; i++) {
    if (i % 2 === 0) {
      // Text chunk
      const trimmed = chunks[i].trim();
      if (trimmed) {
        content.push({
          text: trimmed,
          style: 'body',
          margin: [0, 0, 0, 8],
        } as ContentText);
      }
    } else {
      // Image placeholder
      const img = imageMap.get(Number(chunks[i]));
      if (img) {
        const url = resolveImageUrl(img);
        if (url) {
          content.push({
            image: url,
            width: 400,
            margin: [0, 4, 0, 8],
          } as ContentImage);
        }
        if (img.caption) {
          content.push({
            text: img.caption,
            style: 'caption',
            margin: [0, 0, 0, 8],
          } as ContentText);
        }
      }
    }
  }

  return content;
}

function buildDocumentDefinition(
  doc: ComposerDocument,
  cardMap: Map<string, CardRecord>,
): TDocumentDefinitions {
  const title = normalizeSpace(doc.title) || 'Documento sin título';
  const sorted = [...doc.items].sort((a, b) => a.order - b.order);

  const content: Content[] = [];

  // Title page
  content.push({ text: title, style: 'title', margin: [0, 0, 0, 8] } as ContentText);

  if (doc.subtitle) {
    content.push({
      text: normalizeSpace(doc.subtitle),
      style: 'subtitle',
      margin: [0, 0, 0, 4],
    } as ContentText);
  }

  if (doc.compiler) {
    content.push({
      text: `Compilado por ${normalizeSpace(doc.compiler)}`,
      style: 'compiler',
      margin: [0, 0, 0, 4],
    } as ContentText);
  }

  if (doc.intro) {
    content.push({
      text: normalizeSpace(doc.intro),
      style: 'intro',
      margin: [0, 16, 0, 8],
    } as ContentText);
  }

  // Card sections
  for (let i = 0; i < sorted.length; i++) {
    const card = cardMap.get(sorted[i].cardId);
    if (card) {
      content.push(...cardToContent(card, i));
    } else {
      content.push({
        text: `[Tarjeta no encontrada: ${sorted[i].cardId}]`,
        style: 'body',
        pageBreak: i === 0 ? undefined : 'before',
      } as ContentText);
    }
  }

  // Footer: export timestamp
  const now = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    content,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.5,
    },
    styles: {
      title: {
        fontSize: 22,
        bold: true,
        alignment: 'center',
        margin: [0, 40, 0, 8],
      },
      subtitle: {
        fontSize: 14,
        alignment: 'center',
        color: '#555555',
      },
      compiler: {
        fontSize: 10,
        alignment: 'center',
        color: '#777777',
        italics: true,
      },
      intro: {
        fontSize: 10,
        color: '#444444',
        alignment: 'justify',
      },
      cardHeading: {
        fontSize: 13,
        bold: true,
        margin: [0, 8, 0, 4],
      },
      tags: {
        fontSize: 9,
        color: '#888888',
        italics: true,
      },
      body: {
        fontSize: 11,
        alignment: 'justify',
      },
      caption: {
        fontSize: 9,
        color: '#888888',
        italics: true,
        alignment: 'center',
      },
    },
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#999999',
      margin: [0, 0, 0, 16],
    }),
    info: {
      title,
      author: doc.compiler || '',
      creationDate: new Date(),
    },
  };
}

function slugify(text: string): string {
  return (text || 'documento')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Generates and downloads a PDF using pdfmake.
 * One click — no print dialog, real PDF file.
 */
export async function downloadPdf(
  doc: ComposerDocument,
  cardMap: Map<string, CardRecord>,
): Promise<void> {
  const def = buildDocumentDefinition(doc, cardMap);

  return new Promise((resolve) => {
    const date = new Date().toISOString().slice(0, 10);
    const filename = `semioteca-${slugify(doc.title)}-${date}.pdf`;

    pdfMake.createPdf(def).download(filename); resolve();
  });
}

/**
 * Triggers a download of the raw Markdown file.
 */
export function downloadMarkdown(markdown: string, docTitle: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `semioteca-${slugify(docTitle)}-${date}.md`;

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
