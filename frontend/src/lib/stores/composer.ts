import { writable, derived } from 'svelte/store';
import {
  type ComposerDocument,
  type ComposerItem,
  CARD_LIMIT,
  createEmptyDocument,
} from '$lib/types/composer';

const STORAGE_KEY = 'semioteca:composer:v1';

function loadFromStorage(): ComposerDocument {
  if (typeof localStorage === 'undefined') return createEmptyDocument();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyDocument();

    const parsed = JSON.parse(raw);

    // Version guard: reset if stored version differs from current
    if (parsed.version !== 1) return createEmptyDocument();

    // Basic shape validation
    if (!Array.isArray(parsed.items)) return createEmptyDocument();

    return {
      version: 1,
      title: typeof parsed.title === 'string' ? parsed.title : '',
      subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : undefined,
      compiler: typeof parsed.compiler === 'string' ? parsed.compiler : undefined,
      intro: typeof parsed.intro === 'string' ? parsed.intro : undefined,
      items: parsed.items
        .filter(
          (item: unknown) =>
            item &&
            typeof item === 'object' &&
            typeof (item as ComposerItem).cardId === 'string' &&
            typeof (item as ComposerItem).order === 'number',
        )
        .map((item: ComposerItem) => ({
          cardId: item.cardId,
          order: item.order,
        })),
    };
  } catch {
    // Corrupted data — reset silently
    return createEmptyDocument();
  }
}

function persist(doc: ComposerDocument) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

function createComposerStore() {
  const initial = loadFromStorage();
  const store = writable<ComposerDocument>(initial);

  // Auto-persist on every change
  store.subscribe((doc) => {
    persist(doc);
  });

  function addCard(cardId: string) {
    store.update((doc) => {
      if (doc.items.length >= CARD_LIMIT) return doc;
      if (doc.items.some((item) => item.cardId === cardId)) return doc;

      const nextOrder =
        doc.items.length > 0 ? Math.max(...doc.items.map((i) => i.order)) + 1 : 1;

      return {
        ...doc,
        items: [...doc.items, { cardId, order: nextOrder }],
      };
    });
  }

  function removeCard(cardId: string) {
    store.update((doc) => {
      const filtered = doc.items
        .filter((item) => item.cardId !== cardId)
        .map((item, index) => ({ ...item, order: index + 1 }));

      return { ...doc, items: filtered };
    });
  }

  function moveCard(cardId: string, direction: 'up' | 'down') {
    store.update((doc) => {
      const sorted = [...doc.items].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((item) => item.cardId === cardId);
      if (index === -1) return doc;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return doc;

      // Swap
      [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];

      // Renumber
      const renumbered = sorted.map((item, i) => ({ ...item, order: i + 1 }));

      return { ...doc, items: renumbered };
    });
  }

  function reorderCards(fromIndex: number, toIndex: number) {
    store.update((doc) => {
      const sorted = [...doc.items].sort((a, b) => a.order - b.order);
      if (fromIndex < 0 || fromIndex >= sorted.length) return doc;
      if (toIndex < 0 || toIndex >= sorted.length) return doc;
      if (fromIndex === toIndex) return doc;

      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);

      const renumbered = sorted.map((item, i) => ({ ...item, order: i + 1 }));

      return { ...doc, items: renumbered };
    });
  }

  function updateMeta(
    patch: Partial<Pick<ComposerDocument, 'title' | 'subtitle' | 'compiler' | 'intro'>>,
  ) {
    store.update((doc) => ({ ...doc, ...patch }));
  }

  function clearDocument() {
    store.set(createEmptyDocument());
  }

  return {
    subscribe: store.subscribe,
    addCard,
    removeCard,
    moveCard,
    reorderCards,
    updateMeta,
    clearDocument,
  };
}

export const composer = createComposerStore();

// Derived stores for convenience
export const selectedCardIds = derived(composer, ($composer) =>
  $composer.items.map((item) => item.cardId),
);

export const selectedCount = derived(composer, ($composer) => $composer.items.length);

export const isAtLimit = derived(composer, ($composer) => $composer.items.length >= CARD_LIMIT);

export function isSelected(cardId: string): boolean {
  // Helper that reads the store synchronously (for use in non-reactive contexts)
  let result = false;
  composer.subscribe((doc) => {
    result = doc.items.some((item) => item.cardId === cardId);
  })();
  return result;
}
