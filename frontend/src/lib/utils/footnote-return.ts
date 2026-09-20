/**
 * Footnote return-to-position — dormant feature.
 *
 * Captures the scroll position when a superscript link (<a href="#fn-N">)
 * is clicked, so a floating "↑ Volver" button can scroll back to it after
 * the user lands in the Notas section.
 *
 * Why dormant: the click handler needed to live on a non-interactive
 * <div> wrapping the card list, which triggered a11y warnings
 * (a11y_no_static_element_interactions / a11y_click_events_have_key_events).
 * Event delegation on non-interactive containers is a valid pattern, but
 * the warnings were noisy.
 *
 * To re-enable:
 *  1. Move the state, functions, and effect back into +page.svelte.
 *  2. Add `onclick={handleFootnoteClick}` to the card column <div>.
 *  3. Add the floating button template before the ComposerTray.
 *  4. Bind `notasSectionEl` to the Notas <div>.
 *
 * Alternatively, attach onclick directly to the <a> tags via the
 * linkFootnotes utility (see $lib/utils/footnotes.ts).
 */

// --- State ---
// let footnoteReturnY: number | null = null;
// let notasVisible = false;
// let notasSectionEl: HTMLElement | null = null;

// --- Handler ---
// function handleFootnoteClick(e: MouseEvent) {
//   if ((e.target as HTMLElement).closest('a[href^="#fn-"]')) {
//     footnoteReturnY = window.scrollY;
//   }
// }

// --- Return ---
// function scrollToReturnPosition() {
//   if (footnoteReturnY !== null) {
//     window.scrollTo({ top: footnoteReturnY, behavior: 'smooth' });
//     footnoteReturnY = null;
//   }
// }

// --- Visibility observer ---
// $effect(() => {
//   if (!notasSectionEl) return;
//   const observer = new IntersectionObserver(
//     ([entry]) => { notasVisible = entry.isIntersecting; },
//     { threshold: 0.1 },
//   );
//   observer.observe(notasSectionEl);
//   return () => observer.disconnect();
// });

// --- Template (before <ComposerTray>) ---
// {#if notasVisible && footnoteReturnY !== null}
//   <button
//     type="button"
//     class="fixed bottom-20 right-4 z-30 btn btn-sm shadow-lg bg-base-200 border border-base-300"
//     onclick={scrollToReturnPosition}
//     aria-label="Volver a la referencia"
//   >
//     ↑ Volver
//   </button>
// {/if}
