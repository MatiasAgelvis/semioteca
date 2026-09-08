/**Tracks an in-flight document export so multiple UI surfaces can show a
 * spinner without each call site managing its own boolean.
 *
 * The export pipeline (especially PDF, which lazy-loads ~1.8 MB of pdfmake +
 * embedded fonts on first click) takes long enough that users need
 * visual feedback. Both ``ComposerTray`` and the ``/cards/compose`` page
 * trigger exports, so the busy state lives in a shared store rather than
 * in component-local state.
 *
 * Call sites subscribe with ``$exporting`` and compare against an
 * :type:`ExportKind` to decide whether to disable their own button:
 *
 *   {#if $exporting === 'pdf'}
 *     <span class="loading loading-spinner loading-sm"></span>
 *   {/if}
 */

import { writable } from 'svelte/store';

export type ExportKind = 'pdf' | 'markdown';

export const exporting = writable<ExportKind | null>(null);
