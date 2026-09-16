import { tick } from 'svelte';
import type { CardRecord } from '$lib/types/content';

/**
 * Shared IntersectionObserver logic for tracking which card is centered in the
 * viewport.  Used by both the `/cards` (book) view and the `/search` view.
 *
 * Returns reactive state + helpers that the consuming page wires into its
 * template and lifecycle.
 */
export function useCardObserver() {
  let observer: IntersectionObserver | null = null;
  const cardElements = new Map<string, HTMLElement>();
  const visibleCardIds = new Set<string>();

  // --- focus lock (used by scrollToCard in /cards) ---
  let focusLockCardId: string | null = null;
  let focusLockTimeout: ReturnType<typeof setTimeout> | null = null;
  let scrollEndListener: (() => void) | null = null;

  // The latest value set by the observer — consumed by the page as `$state`.
  let _focusedCardId: string | null = $state(null);

  /** Current card id closest to viewport center. */
  function getFocusedCardId(): string | null {
    return _focusedCardId;
  }

  /** Directly set the focused card (e.g. on initial load). */
  function setFocusedCardId(id: string | null) {
    _focusedCardId = id;
  }

  // --- registration (Svelte 5 action) ---

  function registerCard(id: string, el: HTMLElement) {
    cardElements.set(id, el);
    observer?.observe(el);
  }

  function unregisterCard(id: string) {
    const el = cardElements.get(id);
    if (el) observer?.unobserve(el);
    cardElements.delete(id);
    visibleCardIds.delete(id);
    if (focusLockCardId === id) {
      focusLockCardId = null;
      if (focusLockTimeout) {
        clearTimeout(focusLockTimeout);
        focusLockTimeout = null;
      }
      if (scrollEndListener) {
        window.removeEventListener('scrollend', scrollEndListener);
        scrollEndListener = null;
      }
    }
  }

  /** Svelte 5 action — attach to each card wrapper element. */
  function cardAction(node: HTMLElement, id: string) {
    registerCard(id, node);
    return {
      destroy() {
        unregisterCard(id);
      },
    };
  }

  // --- observer setup ---

  async function setupObserver(cards: CardRecord[], opts?: { defaultId?: string | null }) {
    await tick();
    observer?.disconnect();
    visibleCardIds.clear();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-card-id');
          if (!id) continue;
          if (entry.isIntersecting) visibleCardIds.add(id);
          else visibleCardIds.delete(id);
        }
        // While a click-scroll is in flight, freeze the highlight on the target.
        if (focusLockCardId) return;

        let bestMatch: string | null = null;
        let minDistance = Infinity;
        const viewportCenter = window.innerHeight / 2;

        for (const id of visibleCardIds) {
          const el = cardElements.get(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const cardMiddle = rect.top + rect.height / 2;
          const distance = Math.abs(cardMiddle - viewportCenter);
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = id;
          }
        }
        if (bestMatch) _focusedCardId = bestMatch;
        else if (cards.length > 0) _focusedCardId = cards[0].id;
      },
      {
        root: null,
        rootMargin: '-25% 0px -40% 0px',
        threshold: [0, 0.1, 0.5],
      },
    );
    for (const card of cards) {
      const node = cardElements.get(card.id);
      if (node) observer.observe(node);
    }
    if (cards.length > 0 && (!_focusedCardId || !cards.some((c) => c.id === _focusedCardId))) {
      _focusedCardId = opts?.defaultId ?? cards[0].id;
    }
  }

  // --- focus lock (for scrollToCard) ---

  /**
   * Freeze the highlight on `id` so the observer won't re-pick while a smooth
   * scroll is in flight.
   */
  function freezeFocus(id: string) {
    // Detach any previous scrollend listener first.
    if (scrollEndListener) {
      window.removeEventListener('scrollend', scrollEndListener);
      scrollEndListener = null;
    }

    focusLockCardId = id;
    if (focusLockTimeout) clearTimeout(focusLockTimeout);
    focusLockTimeout = setTimeout(() => {
      if (focusLockCardId === id) focusLockCardId = null;
      focusLockTimeout = null;
      if (scrollEndListener) {
        window.removeEventListener('scrollend', scrollEndListener);
        scrollEndListener = null;
      }
    }, 600);

    // `scrollend` (Safari 17.4+, Chromium, Firefox 137+) releases the lock as
    // soon as the smooth scroll settles — before the 600ms fallback timer.
    const supportsScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;
    if (supportsScrollEnd) {
      const handler = () => {
        if (scrollEndListener !== handler) return;
        if (focusLockCardId === id) focusLockCardId = null;
        if (focusLockTimeout) {
          clearTimeout(focusLockTimeout);
          focusLockTimeout = null;
        }
        scrollEndListener = null;
      };
      scrollEndListener = handler;
      window.addEventListener('scrollend', handler, { passive: true, once: true });
    }
  }

  function unfreezeFocus() {
    focusLockCardId = null;
    if (focusLockTimeout) {
      clearTimeout(focusLockTimeout);
      focusLockTimeout = null;
    }
    if (scrollEndListener) {
      window.removeEventListener('scrollend', scrollEndListener);
      scrollEndListener = null;
    }
  }

  function destroy() {
    observer?.disconnect();
    unfreezeFocus();
  }

  return {
    get focusedCardId() {
      return getFocusedCardId();
    },
    set focusedCardId(id: string | null) {
      setFocusedCardId(id);
    },
    cardAction,
    register: registerCard,
    unregister: unregisterCard,
    setupObserver,
    freezeFocus,
    unfreezeFocus,
    destroy,
  };
}
