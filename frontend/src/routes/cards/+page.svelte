<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto, afterNavigate, replaceState } from '$app/navigation';
  import PageSection from '$lib/components/PageSection.svelte';
  import BookSidebar from '$lib/components/BookSidebar.svelte';
  import CardItem from '$lib/components/CardItem.svelte';
  import CardsToc from '$lib/components/CardsToc.svelte';
  import {
    cardsSearchDialogOpen,
    cardsSearchQuery,
    cardsSearchFullResultsRequest,
    closeCardsSearch,
    openCardsSearch,
  } from '$lib/stores/cardsSearch';
  import { getBookKey } from '$lib/utils/books';
  import { tokenizeQuery } from '$lib/utils/search';
  import { getRankedSearchResults } from '$lib/utils/cardsSearch';
  import { sanitizeHtml } from '$lib/utils/html';
  import { page } from '$app/stores';
  import { parseSearchUrl, buildSearchParams } from '$lib/utils/searchUrl';
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
  let fullResultsMode = $state(false);
  let initializedFromUrl = $state(false);
  let returnToCardId = $state<string | null>(
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cards:returnTo') : null,
  );
  let focusedCardId = $state<string | null>(null);
  let mobileDrawerOpen = $state(false);
  let composerTrayHeight = $state(0);
  let cards = $state<CardRecord[]>([]);
  const cardMap = $derived(new Map(cards.map((c): [string, CardRecord] => [c.id, c])));

  // Committed search state — only mutated when the dialog commits via
  // onopenfullresults callback.
  let selectedAuthors = $state<Set<string>>(new Set());
  let selectedTags = $state<Set<string>>(new Set());
  let matchMode = $state<'all' | 'any'>('all');
  let searchFields = $state({
    content: true,
    authorBook: true,
    page: true,
    tags: true,
  });

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

  let observer: IntersectionObserver | null = null;
  const cardElements = new Map<string, HTMLElement>();
  const visibleCardIds = new Set<string>();
  let focusLockCardId: string | null = null;
  let focusLockTimeout: ReturnType<typeof setTimeout> | null = null;
  let scrollEndListener: (() => void) | null = null;
  let debouncedQuery = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let shareCopied = $state(false);
  let shareTimeout: ReturnType<typeof setTimeout> | null = null;
  const canSystemShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);
  let relationsMap = $state<Record<string, CardRelationEntry[]> | null>(null);
  let relatedRelations = $state<RelatedCard[]>([]);
  let relatedSheetOpen = $state(false);
  let currentSheetCardId = $state('');

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(location.href);
      shareCopied = true;
      if (shareTimeout) clearTimeout(shareTimeout);
      shareTimeout = setTimeout(() => {
        shareCopied = false;
        shareTimeout = null;
      }, 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  const shareLabel = $derived(
    fullResultsMode ? 'Compartir resultados' : selectedBook ? 'Compartir libro' : 'Compartir',
  );

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
    fullResultsMode = false;
    selectedBook = getBookKey(card);
    relatedSheetOpen = false;
    tick().then(() => scrollToCard(card.id));
  }

  $effect(() => {
    const q = $cardsSearchQuery;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debouncedQuery = q;
      debounceTimer = null;
    }, 200);
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
    };
  });

  const searchTerms = $derived(tokenizeQuery(debouncedQuery));

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

  const hasSearchCriteria = $derived(
    searchTerms.length > 0 || selectedAuthors.size > 0 || selectedTags.size > 0,
  );

  const rankedSearchResults = $derived.by(() =>
    getRankedSearchResults(
      cards,
      searchTerms,
      selectedAuthors,
      selectedTags,
      searchFields,
      matchMode,
    ),
  );

  const searchResults = $derived(rankedSearchResults.slice(0, 24));
  const fullResultsCount = $derived(rankedSearchResults.length);
  const displayCards = $derived(fullResultsMode ? rankedSearchResults : filteredCards);

  function registerCard(el: HTMLElement, id: string) {
    cardElements.set(id, el);
    observer?.observe(el);
  }

  function unregisterCard(el: HTMLElement, id: string) {
    observer?.unobserve(el);
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

  async function scrollToCard(id: string) {
    const cardIndex = displayCards.findIndex((card) => card.id === id);
    if (cardIndex === -1) return;

    let node = cardElements.get(id) ?? document.getElementById(`card-${id}`);
    if (!node) {
      await tick();
      node = cardElements.get(id) ?? document.getElementById(`card-${id}`);
    }

    if (!node) return;

    // Detach a previous click's `scrollend` listener (if any) so it can't release
    // the lock we're about to set. Defensive — the timer below also bails if the
    // captured `id` no longer matches — but avoids the listener firing on a stale
    // scroll anyway.
    if (scrollEndListener) {
      window.removeEventListener('scrollend', scrollEndListener);
      scrollEndListener = null;
    }

    focusLockCardId = id;
    if (focusLockTimeout) clearTimeout(focusLockTimeout);
    focusLockTimeout = setTimeout(() => {
      // Timer fallback for browsers without `scrollend`, or when the scroll is
      // canceled (Escape, another click, programmatic navigation).
      if (focusLockCardId === id) focusLockCardId = null;
      focusLockTimeout = null;
      if (scrollEndListener) {
        window.removeEventListener('scrollend', scrollEndListener);
        scrollEndListener = null;
      }
    }, 600);

    // `scrollend` (Safari 17.4+, Chromium-based, Firefox 137+) lets us release the
    // lock as soon as the smooth scroll actually settles — before the 600ms timer.
    // Fall back silently if unsupported.
    const supportsScrollEnd = 'onscrollend' in window;
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

    focusedCardId = id;
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
    fullResultsMode = false;
    selectedBook = key;
    mobileDrawerOpen = false;
  }

  async function handleSelectSearchResult(card: CardRecord) {
    fullResultsMode = false;
    selectedBook = getBookKey(card);
    (document.activeElement as HTMLElement | null)?.blur();
    closeCardsSearch();
    await tick();
    await scrollToCard(card.id);
  }

  async function handleOpenFullResults(params: {
    query: string;
    tags: Set<string>;
    authors: Set<string>;
    mode: 'all' | 'any';
    fields: { content: boolean; authorBook: boolean; page: boolean; tags: boolean };
  }) {
    fullResultsMode = true;
    closeCardsSearch();
    mobileDrawerOpen = false;

    // Push dialog state → committed search state
    $cardsSearchQuery = params.query;
    debouncedQuery = params.query;
    selectedTags = new Set(params.tags);
    selectedAuthors = new Set(params.authors);
    matchMode = params.mode;
    searchFields = { ...params.fields };

    // Sync search state to URL
    const urlParams = buildSearchParams({
      q: params.query,
      tags: Array.from(params.tags),
      authors: Array.from(params.authors),
      mode: params.mode,
    });
    const qs = urlParams.toString();
    const url = qs ? `/cards?${qs}` : '/cards';
    await goto(url, { replaceState: true, noScroll: true, keepFocus: true });

    await tick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeFullResultsMode() {
    fullResultsMode = false;
    const url = selectedBook ? `/cards?book=${encodeURIComponent(selectedBook)}` : '/cards';
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function handleTocScroll(id: string) {
    scrollToCard(id);
    mobileDrawerOpen = false;
  }

  async function setupObserver() {
    if (typeof window === 'undefined' || loading) return;
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
        // Releasing on first intersection (the previous behavior) tripped up smooth
        // scrolls: the target enters the band before the scroll settles, the lock
        // releases mid-animation, and a follow-up event re-picks before the user sees
        // the centered result. The lock is now released by `scrollToCard` via the
        // 600ms timer / `scrollend` listener.
        if (focusLockCardId) {
          return;
        }
        // Pick the most centered card among all currently visible ones
        let bestMatch: string | null = null;
        let minDistance = Infinity;
        // Match the position that scrollIntoView({ block: 'center' }) lands a card at.
        // Before, this was 0.4, which made the post-scroll "best match" land on the
        // card immediately above the clicked one.
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
        if (bestMatch) focusedCardId = bestMatch;
        else if (displayCards.length > 0) focusedCardId = displayCards[0].id;
      },
      {
        root: null,
        rootMargin: '-25% 0px -40% 0px',
        threshold: [0, 0.1, 0.5],
      },
    );
    for (const card of displayCards) {
      const node = cardElements.get(card.id);
      if (node) observer.observe(node);
    }
    if (
      displayCards.length > 0 &&
      (!focusedCardId || !displayCards.some((c) => c.id === focusedCardId))
    ) {
      focusedCardId = displayCards[0].id;
    }
  }

  onMount(() => {
    let cancelled = false;
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openCardsSearch();
      }
    };

    // Restore search state from URL params (runs once on page load)
    const urlParams = parseSearchUrl(new URL(window.location.href).searchParams);
    const hasUrlParams = Object.keys(urlParams).length > 0;
    if (hasUrlParams) {
      if (urlParams.q) $cardsSearchQuery = urlParams.q;
      if (urlParams.tags) selectedTags = new Set(urlParams.tags);
      if (urlParams.authors) selectedAuthors = new Set(urlParams.authors);
      if (urlParams.mode) matchMode = urlParams.mode;
      if (urlParams.book) selectedBook = urlParams.book;
    }

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
        if (hasUrlParams) {
          fullResultsMode = true;
          initializedFromUrl = true;
        }
        loading = false;
        await setupObserver();
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
      if (scrollEndListener) {
        window.removeEventListener('scrollend', scrollEndListener);
        scrollEndListener = null;
      }
      observer?.disconnect();
      if (focusLockTimeout) clearTimeout(focusLockTimeout);
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
    fullResultsMode;
    displayCards.length;
    void setupObserver();
  });

  $effect(() => {
    if (fullResultsMode && !hasSearchCriteria) {
      fullResultsMode = false;
    }
  });

  // Sync selected book to URL (only in browse mode, not full-results)
  $effect(() => {
    if (loading || fullResultsMode) return;
    if (!selectedBook || !booksModel.length) return;
    const currentUrl = new URL(window.location.href);
    // Don't interfere when URL has search params (full-results mode)
    if (
      currentUrl.searchParams.has('q') ||
      currentUrl.searchParams.has('tags') ||
      currentUrl.searchParams.has('authors')
    )
      return;
    const currentBook = currentUrl.searchParams.get('book');
    if (currentBook === selectedBook) return;
    currentUrl.searchParams.set('book', selectedBook);
    replaceState(currentUrl.toString(), {});
  });

  // React to URL param changes (e.g. from SearchDialog "go to full results")
  let initialUrlApplied = false;
  $effect(() => {
    const search = $page.url.search;
    console.log(
      '[cards page] $effect fired, search:',
      search,
      'initialUrlApplied:',
      initialUrlApplied,
    );
    if (!initialUrlApplied) {
      initialUrlApplied = true;
      return; // onMount already handles the initial URL
    }
    const urlParams = parseSearchUrl($page.url.searchParams);
    if (Object.keys(urlParams).length === 0) return;
    fullResultsMode = false;
    if (urlParams.q) $cardsSearchQuery = urlParams.q;
    if (urlParams.tags) selectedTags = new Set(urlParams.tags);
    if (urlParams.authors) selectedAuthors = new Set(urlParams.authors);
    if (urlParams.book) selectedBook = urlParams.book;
  });

  // Watch for full-results requests from the global SearchDialog
  $effect(() => {
    const request = $cardsSearchFullResultsRequest;
    if (!request) return;
    // Apply the search state
    $cardsSearchQuery = request.query;
    selectedTags = request.tags;
    selectedAuthors = request.authors;
    matchMode = request.mode;
    // ... (fields are already in dialogFields via the store)
    fullResultsMode = true;
    // Clear the request so it doesn't re-trigger
    cardsSearchFullResultsRequest.set(null);
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
      {#if fullResultsMode}
        <span>{fullResultsCount} resultados globales</span>
        <button class="btn btn-ghost btn-xs" type="button" onclick={closeFullResultsMode}
          >Volver al modo libro</button
        >
      {:else}
        <span>{filteredCards.length} tarjetas en este libro.</span>
      {/if}

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
            {#if !fullResultsMode}
              <BookSidebar
                books={booksModel}
                selectedBook={selectedBook ?? ''}
                onselect={selectBook}
              />
            {/if}
            <CardsToc
              cards={displayCards}
              {focusedCardId}
              searchTerms={fullResultsMode ? searchTerms : []}
              compact={!fullResultsMode}
              onscrollto={handleTocScroll}
            />
          </div>
        </div>
      </div>

      <div
        class={`grid gap-6 ${fullResultsMode ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-[18rem_minmax(0,1fr)_18rem]'}`}
      >
        {#if !fullResultsMode}
          <div class="hidden lg:block min-w-0">
            <BookSidebar
              books={booksModel}
              selectedBook={selectedBook ?? ''}
              onselect={selectBook}
            />
          </div>
        {/if}

        <div class="space-y-5">
          {#if loading}
            <p>Cargando tarjetas...</p>
          {:else}
            {#each displayCards as card (card.id)}
              <CardItem
                {card}
                focused={focusedCardId === card.id}
                searchTerms={fullResultsMode ? searchTerms : []}
                onregister={registerCard}
                onunregister={unregisterCard}
                onopenrelations={handleOpenRelations}
              />
            {/each}
            {#if displayCards.length === 0}
              <p class="text-sm">
                No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.
              </p>
            {/if}
          {/if}
        </div>

        <div class="hidden lg:block min-w-0">
          <CardsToc
            cards={displayCards}
            {focusedCardId}
            searchTerms={fullResultsMode ? searchTerms : []}
            compact={!fullResultsMode}
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

{#if shareCopied}
  <div class="toast toast-bottom toast-end z-50">
    <div class="alert alert-success py-2 text-sm shadow-lg">
      <span>Enlace copiado</span>
    </div>
  </div>
{/if}

<RelatedCardsSheet
  relations={relatedRelations}
  show={relatedSheetOpen}
  onclose={() => (relatedSheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={currentSheetCardId}
/>
