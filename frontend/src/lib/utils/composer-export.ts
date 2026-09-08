import type { CardRecord } from '$lib/types/content';
import { buildDocumentMarkdown } from './composer-markdown';
import { downloadMarkdown, downloadPdf } from './composer-pdf';
import { showToast } from '$lib/stores/toast';
import { exporting } from '$lib/stores/export';
import type { ComposerDocument } from '$lib/types/composer';

type CardMap = Map<string, CardRecord>;

/**
 * Export the document as a PDF, surfacing success/error via the toast system.
 * Single source of truth so the two call sites (composer tray, /cards/compose)
 * can't drift apart on toast text or error handling.
 *
 * The ``exporting`` store is held for the duration of the call so any
 * ``$exporting === 'pdf'`` subscriber can show a spinner / disable itself.
 */
export async function exportDocumentAsPdf(doc: ComposerDocument, cardMap: CardMap): Promise<void> {
  exporting.set('pdf');
  try {
    await downloadPdf(doc, cardMap);
    showToast('PDF descargado', 'success');
  } catch (err) {
    console.error('PDF export failed:', err);
    showToast('No se pudo generar el PDF', 'error');
  } finally {
    exporting.set(null);
  }
}

/**
 * Export the document as Markdown. `docTitle` defaults to a generic label so the
 * caller doesn't need to handle the empty-title case.
 */
export async function exportDocumentAsMarkdown(
  doc: ComposerDocument,
  cardMap: CardMap,
  docTitle = 'Documento sin título',
): Promise<void> {
  exporting.set('markdown');
  // Markdown export is synchronous, but keep the store update symmetrical
  // with the PDF path — both flip the store on entry, both clear it on exit.
  try {
    const markdown = buildDocumentMarkdown(doc, cardMap);
    downloadMarkdown(markdown, docTitle);
    showToast('Documento Markdown descargado', 'success');
  } catch (err) {
    console.error('Markdown export failed:', err);
    showToast('No se pudo generar el Markdown', 'error');
  } finally {
    exporting.set(null);
  }
}
