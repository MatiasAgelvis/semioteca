import type { CardRecord } from '$lib/types/content';
import { buildDocumentMarkdown } from './composer-markdown';
import { downloadMarkdown, downloadPdf } from './composer-pdf';
import { showToast } from '$lib/stores/toast';
import type { ComposerDocument } from '$lib/types/composer';

type CardMap = Map<string, CardRecord>;

/**
 * Export the document as a PDF, surfacing success/error via the toast system.
 * Single source of truth so the two call sites (composer tray, /cards/compose)
 * can't drift apart on toast text or error handling.
 */
export async function exportDocumentAsPdf(doc: ComposerDocument, cardMap: CardMap): Promise<void> {
  try {
    await downloadPdf(doc, cardMap);
    showToast('PDF descargado', 'success');
  } catch (err) {
    console.error('PDF export failed:', err);
    showToast('No se pudo generar el PDF', 'error');
  }
}

/**
 * Export the document as Markdown. `docTitle` defaults to a generic label so the
 * caller doesn't need to handle the empty-title case.
 */
export function exportDocumentAsMarkdown(
  doc: ComposerDocument,
  cardMap: CardMap,
  docTitle = 'Documento sin título',
): void {
  const markdown = buildDocumentMarkdown(doc, cardMap);
  try {
    downloadMarkdown(markdown, docTitle);
    showToast('Documento Markdown descargado', 'success');
  } catch (err) {
    console.error('Markdown export failed:', err);
    showToast('No se pudo generar el Markdown', 'error');
  }
}
