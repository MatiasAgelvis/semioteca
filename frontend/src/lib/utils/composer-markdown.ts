import type { CardRecord, CardImage } from '$lib/types/content';
import type { ComposerDocument } from '$lib/types/composer';

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function resolveImageUrl(image: CardImage): string {
  const idx = image.path.indexOf('cards_images/');
  return idx !== -1 ? `/content/${image.path.slice(idx)}` : '';
}

function resolveImageMarkdown(image: CardImage): string {
  const url = resolveImageUrl(image);
  const alt = image.alt_text ?? image.caption ?? '';
  const caption = image.caption ? `\n*${image.caption}*` : '';
  return `![${alt}](${url})${caption}`;
}

function contentToMarkdown(card: CardRecord): string {
  const imageMap = new Map(card.images.map((img) => [img.placeholder_id, img]));
  const chunks = card.content.split(/\[\[IMAGE:(\d+)\]\]/g);

  let result = '';
  for (let i = 0; i < chunks.length; i++) {
    if (i % 2 === 0) {
      // Text chunk
      const trimmed = chunks[i].trim();
      if (trimmed) result += trimmed + '\n\n';
    } else {
      // Image placeholder
      const img = imageMap.get(Number(chunks[i]));
      if (img) {
        result += resolveImageMarkdown(img) + '\n\n';
      }
    }
  }

  return result.trim();
}

/**
 * Builds a complete Markdown document from the composer state and card data.
 * Returns the markdown string ready for rendering or download.
 */
export function buildDocumentMarkdown(
  doc: ComposerDocument,
  cardMap: Map<string, CardRecord>,
): string {
  const lines: string[] = [];

  // Document title
  const title = normalizeSpace(doc.title) || 'Documento sin título';
  lines.push(`# ${title}`);

  if (doc.subtitle) {
    lines.push(`\n${normalizeSpace(doc.subtitle)}`);
  }

  if (doc.compiler) {
    lines.push(`\n*Compilado por ${normalizeSpace(doc.compiler)}*`);
  }

  if (doc.intro) {
    lines.push(`\n${normalizeSpace(doc.intro)}`);
  }

  // Sort items by order
  const sorted = [...doc.items].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const card = cardMap.get(item.cardId);

    lines.push('\n---\n');

    if (!card) {
      lines.push(
        `## ${i + 1}. *[Tarjeta no encontrada]*\n\n> ⚠️ La tarjeta con ID \`${item.cardId}\` ya no existe en el repositorio.`,
      );
      continue;
    }

    // Heading
    const author = normalizeSpace(card.author || 'Autor desconocido');
    const book = normalizeSpace(card.book || 'Sin título');
    const year = normalizeSpace(card.year || 's.f.');
    const page = normalizeSpace(card.page || 's.p.');
    lines.push(`## ${i + 1}. ${author} — ${book} (${year}), p. ${page}`);

    // Tags
    const tags = card.tags?.filter((t) => t.trim().length > 0) ?? [];
    if (tags.length > 0) {
      lines.push(`\n> **Tags:** ${tags.join(', ')}`);
    }

    // Content with images
    const cardContent = contentToMarkdown(card);
    if (cardContent) {
      lines.push(`\n${cardContent}`);
    }
  }

  return lines.join('\n');
}
