<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PageSection from '$lib/components/PageSection.svelte';
  import BookSidebar from '$lib/components/BookSidebar.svelte';
  import CardItem from '$lib/components/CardItem.svelte';
  import CardsToc from '$lib/components/CardsToc.svelte';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { showToast } from '$lib/stores/toast';
  import { getBookKey } from '$lib/utils/books';
  import { sanitizeHtml } from '$lib/utils/html';
  import { useCardObserver } from '$lib/utils/cardObserver.svelte';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';
  import ComposerTray from '$lib/components/ComposerTray.svelte';
  import type {
    CardRecord,
    CardRelationEntry,
    CardsDataset,
    RelatedCard,
  } from '$lib/types/content';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let loading = $state(true);
  let selectedBook = $state<string | null>(null);

  let returnToCardId = $state<string | null>(
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cards:returnTo') : null,
  );
  let mobileDrawerOpen = $state(false);
  let composerTrayHeight = $state(0);
  let cards = $state<CardRecord[]>([]);
  const cardMap = $derived(new Map(cards.map((c): [string, CardRecord] => [c.id, c])));

  const authors = $derived.by(() => {
    const seen = new Set<string>();
    return cards
      .map((c) => c.author)
      .filter((a) => {
        if (seen.has(a)) return false;
        seen.add(a);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  });

  const tags = $derived.by(() => {
    const seen = new Set<string>();
    for (const card of cards) {
      if (!card.tags) continue;
      for (const tag of card.tags) {
        seen.add(tag);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  });

  const cardObs = useCardObserver();

  // CardItem uses (el, id) callbacks — bridge to the observer.
  function registerCard(el: HTMLElement, id: string) {
    cardObs.register(id, el);
  }
  function unregisterCard(_el: HTMLElement, id: string) {
    cardObs.unregister(id);
  }

  const canSystemShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);
  let relationsMap = $state<Record<string, CardRelationEntry[]> | null>(null);
  let relatedRelations = $state<RelatedCard[]>([]);
  let relatedSheetOpen = $state(false);
  let currentSheetCardId = $state('');

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('Enlace copiado', 'success');
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  const shareLabel = $derived(selectedBook ? 'Compartir libro' : 'Compartir');

  async function handleSystemShare() {
    try {
      await navigator.share({ title: document.title, url: location.href });
    } catch {
      /* user cancelled or not supported */
    }
  }

  function handleOpenRelations(cardId: string) {
    const entries = relationsMap?.[cardId];
    if (!entries?.length) {
      relatedRelations = [];
      relatedSheetOpen = true;
      return;
    }
    const cardMap = new Map(cards.map((c) => [c.id, c]));
    relatedRelations = entries
      .map((entry) => {
        const card = cardMap.get(entry.id);
        if (!card) return null;
        const rawContent = card.content ?? '';
        const cleanContent = sanitizeHtml(rawContent)
          .replace(/\[\[IMAGE:\d+\]\]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        const contentPreview =
          cleanContent.length > 160 ? cleanContent.slice(0, 160) + '…' : cleanContent;
        return {
          id: entry.id,
          title: card.book ?? entry.id,
          author: card.author ?? '',
          book: card.book ?? '',
          year: card.year ?? '',
          page: card.page ?? null,
          score: entry.score,
          contentPreview,
          tags: card.tags ?? [],
        };
      })
      .filter((r): r is RelatedCard => r !== null);
    currentSheetCardId = cardId;
    relatedSheetOpen = true;
  }

  function handleSelectRelation(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    selectedBook = getBookKey(card);
    relatedSheetOpen = false;
    tick().then(() => scrollToCard(card.id));
  }

  const booksModel = $derived.by(() => {
    const grouped = new Map<string, { key: string; author: string; title: string; year: string }>();
    for (const card of cards) {
      const key = getBookKey(card);
      const existing = grouped.get(key);
      if (existing) {
        continue;
      }
      grouped.set(key, {
        key,
        author: card.author,
        title: card.book,
        year: card.year,
      });
    }
    return [...grouped.values()].sort((a, b) => {
      const ac = a.author.localeCompare(b.author, 'es', {
        sensitivity: 'base',
      });
      return ac !== 0 ? ac : a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    });
  });

  const filteredCards = $derived.by(() => {
    if (cards.length === 0) return [];
    // Avoid rendering the entire dataset on first paint before selectedBook is initialized.
    const activeBookKey = selectedBook ?? getBookKey(cards[0]);
    return cards.filter((card) => getBookKey(card) === activeBookKey);
  });

  async function scrollToCard(id: string) {
    const cardIndex = filteredCards.findIndex((card) => card.id === id);
    if (cardIndex === -1) return;

    let node = document.getElementById(`card-${id}`);
    if (!node) {
      await tick();
      node = document.getElementById(`card-${id}`);
    }
    if (!node) return;

    cardObs.freezeFocus(id);
    cardObs.focusedCardId = id;
    // Move keyboard focus to the selected card so it does not stay in the search input.
    node.setAttribute('tabindex', '-1');
    node.focus({ preventScroll: true });
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }

  function selectBook(key: string) {
    selectedBook = key;
    mobileDrawerOpen = false;
  }

  function handleTocScroll(id: string) {
    scrollToCard(id);
    mobileDrawerOpen = false;
  }

  onMount(() => {
    let cancelled = false;
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCardsSearch();
      }
    };

    // Restore book selection from URL params (runs once on page load)
    const bookParam = $page.url.searchParams.get('book');
    if (bookParam) selectedBook = bookParam;

    window.addEventListener('keydown', handleKeydown);
    void (async () => {
      const [cardsRes, relationsRes] = await Promise.all([
        fetch('/content/cards.json'),
        fetch('/content/card-relations.json'),
      ]);
      if (cardsRes.ok && !cancelled) {
        const dataset = (await cardsRes.json()) as CardsDataset;
        cards = dataset.books.flatMap((book) => book.cards);
      }
      if (relationsRes.ok && !cancelled) {
        relationsMap = await relationsRes.json();
      }
      if (!cancelled) {
        loading = false;
        await cardObs.setupObserver(filteredCards);
        if (returnToCardId) {
          sessionStorage.removeItem('cards:returnTo');
          const id = returnToCardId;
          returnToCardId = null;
          await tick();
          await scrollToCard(id);
        }
      }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKeydown);
      cardObs.destroy();
    };
  });

  $effect(() => {
    if (loading) return;
    booksModel.length;
    if (booksModel.length === 0) {
      selectedBook = null;
      return;
    }
    if (!selectedBook || !booksModel.some((book) => book.key === selectedBook)) {
      // If restoring a card, pick its book; otherwise default to first book
      if (returnToCardId) {
        const target = cards.find((c) => c.id === returnToCardId);
        if (target) {
          selectedBook = getBookKey(target);
          return;
        }
      }
      selectedBook = booksModel[0].key;
    }
  });

  $effect(() => {
    if (loading) return;
    selectedBook;
    filteredCards.length;
    void cardObs.setupObserver(filteredCards);
  });

  // Sync selected book to URL
  $effect(() => {
    if (loading) return;
    if (!selectedBook || !booksModel.length) return;
    const currentBook = $page.url.searchParams.get('book');
    if (currentBook === selectedBook) return;
    const sp = $page.url.searchParams;
    sp.set('book', selectedBook);
    goto(`/cards?${sp.toString()}`, { replaceState: true, noScroll: true, keepFocus: true }).then(
      () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    );
  });
</script>

<svelte:head>
  <title>Tarjetas | Significado Total</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
  <PageSection
    title="Repositorio de tarjetas"
    description="Búsqueda y navegación por fichas bibliográficas extraídas de los manuscritos fuente."
    headingLevel="h1"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-70">
      <span>{filteredCards.length} tarjetas en este libro.</span>

      <button
        popovertarget="cards-share"
        class="btn btn-ghost btn-xs shrink-0 gap-1"
        aria-label={shareLabel}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="size-4"
        >
          <path
            d="M11.293 2.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1-1.414 1.414L13 5.414V15a1 1 0 1 1-2 0V5.414L9.707 6.707a1 1 0 0 1-1.414-1.414zM4 11a2 2 0 0 1 2-2h2a1 1 0 0 1 0 2H6v9h12v-9h-2a1 1 0 1 1 0-2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
          />
        </svg>
        <span class="hidden md:inline">{shareLabel}</span>
      </button>
      <ul
        class="dropdown menu menu-sm w-60 rounded-box bg-base-100 p-0 shadow"
        popover
        id="cards-share"
      >
        <li><button type="button" onclick={copyShareUrl}>Copiar enlace</button></li>
        {#if canSystemShare}
          <li>
            <button type="button" onclick={handleSystemShare}>Compartir con el sistema…</button>
          </li>
        {/if}
      </ul>
    </div>

    <div class="mt-6">
      <button
        class="btn btn-primary btn-sm fixed right-4 bottom-4 z-30 shadow-lg lg:hidden"
        style:bottom={`${composerTrayHeight + 16}px`}
        onclick={() => {
          mobileDrawerOpen = true;
        }}
      >
        Índice
      </button>
      <div class="drawer drawer-end lg:hidden">
        <input
          id="cards-mobile-drawer"
          type="checkbox"
          class="drawer-toggle"
          bind:checked={mobileDrawerOpen}
        />
        <div class="drawer-content"></div>
        <div class="drawer-side z-40">
          <label for="cards-mobile-drawer" class="drawer-overlay" aria-label="Cerrar panel lateral"
          ></label>
          <div
            class="min-h-full w-80 max-w-[85vw] space-y-4 bg-base-200 px-4 pb-4 pt-[calc(var(--header-height,7rem)+0.75rem)]"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold">Navegacion</p>
              <button
                class="btn btn-ghost btn-xs"
                onclick={() => {
                  mobileDrawerOpen = false;
                }}
              >
                Cerrar
              </button>
            </div>
            <BookSidebar
              books={booksModel}
              selectedBook={selectedBook ?? ''}
              onselect={selectBook}
            />
            <CardsToc
              cards={filteredCards}
              focusedCardId={cardObs.focusedCardId}
              compact
              onscrollto={handleTocScroll}
            />
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <div class="hidden lg:block min-w-0">
          <BookSidebar books={booksModel} selectedBook={selectedBook ?? ''} onselect={selectBook} />
        </div>

        <div class="space-y-5">
          {#if loading}
            <p>Cargando tarjetas...</p>
          {:else}
            {#each filteredCards as card (card.id)}
              <CardItem
                {card}
                focused={cardObs.focusedCardId === card.id}
                onregister={registerCard}
                onunregister={unregisterCard}
                onopenrelations={handleOpenRelations}
              />
            {/each}
            {#if filteredCards.length === 0}
              <p class="text-sm">
                No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.
              </p>
            {/if}
          {/if}
        </div>

        <div class="hidden lg:block min-w-0">
          <CardsToc
            cards={filteredCards}
            focusedCardId={cardObs.focusedCardId}
            compact
            onscrollto={scrollToCard}
          />
        </div>
      </div>
    </div>
  </PageSection>
</div>

<div class="sticky bottom-0 z-40" bind:clientHeight={composerTrayHeight}>
  <ComposerTray {cardMap} />
</div>

<RelatedCardsSheet
  relations={relatedRelations}
  show={relatedSheetOpen}
  onclose={() => (relatedSheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={currentSheetCardId}
/>
