<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { ChevronDown } from '@lucide/svelte';

  import PageSection from '$lib/components/PageSection.svelte';
  import BookSidebar from '$lib/components/BookSidebar.svelte';
  import CardItem from '$lib/components/CardItem.svelte';
  import CardsToc from '$lib/components/CardsToc.svelte';
  import SearchResultItem from '$lib/components/SearchResultItem.svelte';
  import {
    cardsSearchDialogOpen,
    cardsSearchQuery,
    cardsSearchInitialTags,
    closeCardsSearch,
    openCardsSearch,
  } from '$lib/stores/cardsSearch';
  import { getBookKey } from '$lib/utils/books';
  import { tokenizeQuery } from '$lib/utils/search';
  import { getRankedSearchResults } from '$lib/utils/cardsSearch';
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

  // Advanced search filters (committed state — only mutated when the user commits
  // from the dialog via "Ver todos" / Enter)
  let advancedOpen = $state(false);
  let showSearchHint = $state(false);
  let selectedAuthors = $state<Set<string>>(new Set());
  let selectedTags = $state<Set<string>>(new Set());
  let matchMode = $state<'all' | 'any'>('all');
  let searchFields = $state({
    content: true,
    authorBook: true,
    page: true,
    tags: true,
  });

  // Dialog draft state — decoupled from the committed search state above.
  // Typing/toggling here only updates the dialog preview (`dialog*` derived),
  // never the page behind it. The draft is pushed to the committed state on
  // "Ver todos" / Enter via `commitDialogToCommitted()`.
  let dialogQuery = $state('');
  let dialogTags = $state<Set<string>>(new Set());
  let dialogAuthors = $state<Set<string>>(new Set());
  let dialogMatchMode = $state<'all' | 'any'>('all');
  let dialogFields = $state({
    content: true,
    authorBook: true,
    page: true,
    tags: true,
  });

  function syncDialogFromCommitted() {
    dialogQuery = $cardsSearchQuery;
    dialogDebouncedQuery = $cardsSearchQuery;
    dialogTags = new Set(selectedTags);
    dialogAuthors = new Set(selectedAuthors);
    dialogMatchMode = matchMode;
    dialogFields = { ...searchFields };
  }

  function commitDialogToCommitted() {
    $cardsSearchQuery = dialogQuery;
    debouncedQuery = dialogQuery; // skip the 200ms debounce, refresh the page immediately
    selectedTags = new Set(dialogTags);
    selectedAuthors = new Set(dialogAuthors);
    matchMode = dialogMatchMode;
    searchFields = { ...dialogFields };
  }

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

  const dialogActiveFilterCount = $derived(
    dialogAuthors.size +
      dialogTags.size +
      (dialogMatchMode === 'any' ? 1 : 0) +
      (!dialogFields.content || !dialogFields.authorBook || !dialogFields.page || !dialogFields.tags
        ? 1
        : 0),
  );

  function toggleAuthor(author: string) {
    const next = new Set(dialogAuthors);
    if (next.has(author)) next.delete(author);
    else next.add(author);
    dialogAuthors = next;
  }

  function toggleTag(tag: string) {
    const next = new Set(dialogTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    dialogTags = next;
  }

  function clearDialogFilters() {
    dialogAuthors = new Set();
    dialogTags = new Set();
    dialogMatchMode = 'all';
    dialogFields = {
      content: true,
      authorBook: true,
      page: true,
      tags: true,
    };
  }

  let observer: IntersectionObserver | null = null;
  let searchDialog: HTMLDialogElement;
  let searchInput: HTMLInputElement;
  const cardElements = new Map<string, HTMLElement>();
  const visibleCardIds = new Set<string>();
  let focusLockCardId: string | null = null;
  let focusLockTimeout: ReturnType<typeof setTimeout> | null = null;
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
        const cleanContent = rawContent
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

  // Dialog-only search pipeline — same debounce pattern, but feeds the dialog
  // preview (`dialogResults`) instead of the page's committed results.
  let dialogDebouncedQuery = $state('');
  let dialogDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const q = dialogQuery;
    if (dialogDebounceTimer) clearTimeout(dialogDebounceTimer);
    dialogDebounceTimer = setTimeout(() => {
      dialogDebouncedQuery = q;
      dialogDebounceTimer = null;
    }, 200);
    return () => {
      if (dialogDebounceTimer) {
        clearTimeout(dialogDebounceTimer);
        dialogDebounceTimer = null;
      }
    };
  });

  const dialogSearchTerms = $derived(tokenizeQuery(dialogDebouncedQuery));
  const dialogHasCriteria = $derived(
    tokenizeQuery(dialogQuery).length > 0 || dialogAuthors.size > 0 || dialogTags.size > 0,
  );
  const dialogRankedResults = $derived.by(() =>
    getRankedSearchResults(
      cards,
      dialogSearchTerms,
      dialogAuthors,
      dialogTags,
      dialogFields,
      dialogMatchMode,
    ),
  );
  const dialogResults = $derived(dialogRankedResults.slice(0, 24));
  const dialogFullResultsCount = $derived(dialogRankedResults.length);

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
    focusLockCardId = id;
    if (focusLockTimeout) clearTimeout(focusLockTimeout);
    focusLockTimeout = setTimeout(() => {
      if (focusLockCardId === id) focusLockCardId = null;
      focusLockTimeout = null;
    }, 600);
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

  async function openSearchDialog() {
    openCardsSearch();
  }

  function closeSearchDialog() {
    advancedOpen = false;
    closeCardsSearch();
  }

  async function selectSearchResult(card: CardRecord) {
    fullResultsMode = false;
    selectedBook = getBookKey(card);
    (document.activeElement as HTMLElement | null)?.blur();
    closeSearchDialog();
    await tick();
    await scrollToCard(card.id);
  }

  async function openFullResultsMode() {
    if (!dialogHasCriteria) return;

    // Push dialog draft → committed search state (the one and only recompute)
    commitDialogToCommitted();

    fullResultsMode = true;
    closeSearchDialog();
    mobileDrawerOpen = false;

    // Sync search state to URL
    const params = buildSearchParams({
      q: dialogQuery,
      tags: Array.from(dialogTags),
      authors: Array.from(dialogAuthors),
      mode: dialogMatchMode,
    });
    const qs = params.toString();
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
        if (focusLockCardId) {
          if (visibleCardIds.has(focusLockCardId)) {
            focusedCardId = focusLockCardId;
            focusLockCardId = null;
            if (focusLockTimeout) {
              clearTimeout(focusLockTimeout);
              focusLockTimeout = null;
            }
          }
          return;
        }
        // Pick the most centered card among all currently visible ones
        let bestMatch: string | null = null;
        let minDistance = Infinity;
        const viewportCenter = window.innerHeight * 0.4; // Aim for slightly above center

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
    const currentBook = currentUrl.searchParams.get('book');
    if (currentBook === selectedBook) return;
    currentUrl.searchParams.set('book', selectedBook);
    history.replaceState(history.state, '', currentUrl.toString());
  });

  // True once the draft has been seeded for the current open session, so the
  // effect below doesn't overwrite the user's edits on every re-run.
  let dialogSeeded = false;

  $effect(() => {
    if (!searchDialog) return;

    if ($cardsSearchDialogOpen) {
      // First time opening: seed the draft from committed state (or, for a tag
      // click, start a fresh "just this tag" search).
      if (!dialogSeeded) {
        dialogSeeded = true;
        if ($cardsSearchInitialTags.length > 0) {
          dialogQuery = '';
          dialogDebouncedQuery = '';
          dialogTags = new Set($cardsSearchInitialTags);
          dialogAuthors = new Set();
          dialogMatchMode = 'all';
          dialogFields = { content: true, authorBook: true, page: true, tags: true };
        } else {
          syncDialogFromCommitted();
        }
        cardsSearchInitialTags.set([]); // Consume them
      }

      if (!searchDialog.open) {
        searchDialog.showModal();
      }
      void tick().then(() => {
        searchInput?.focus();
        if (dialogQuery) searchInput?.select();
      });
      return;
    }

    dialogSeeded = false;
    if (searchDialog.open) {
      searchDialog.close();
    }
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

<dialog
  bind:this={searchDialog}
  class="modal modal-bottom sm:modal-middle"
  onclose={() => {
    advancedOpen = false;
    closeCardsSearch();
  }}
>
  <div
    class="modal-box flex flex-col overflow-hidden w-full h-full sm:h-auto sm:max-w-3xl rounded-none sm:rounded-box border border-base-300 bg-base-100 p-0 shadow-2xl"
  >
    <div class="shrink-0 border-b border-base-200 px-6 py-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="mt-1 text-xl font-black">Buscar en todas las tarjetas</h3>
        </div>
        <form method="dialog">
          <button class="btn btn-ghost btn-sm" type="submit">Cerrar</button>
        </form>
      </div>
      <div class="mt-4 flex flex-col gap-2">
        <div class="join w-full">
          <input
            bind:this={searchInput}
            bind:value={dialogQuery}
            class="input input-lg input-bordered join-item w-full truncate"
            placeholder="Busca por autor, libro, página, etiquetas o fragmento"
            type="search"
            onkeydown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                openFullResultsMode();
              }
            }}
          />
          <button
            type="button"
            class="btn btn-lg btn-primary join-item shrink-0"
            disabled={dialogFullResultsCount === 0}
            aria-label="Ver todos los resultados"
            title="Ver todos los resultados (Enter)"
            onclick={openFullResultsMode}
          >
            <span aria-hidden="true" class="text-xl">→</span>
          </button>
        </div>
        <!-- Filter chips. Renders only when there are filters — no reserved space when empty. -->
        {#if dialogTags.size > 0 || dialogAuthors.size > 0}
          <div class="flex flex-wrap items-center gap-1.5 pt-1 pb-2 text-xs">
            {#each Array.from(dialogTags) as tag}
              <button
                class="badge badge-primary badge-sm gap-1 hover:badge-error"
                onclick={() => toggleTag(tag)}
              >
                {tag} <span>×</span>
              </button>
            {/each}
            {#each Array.from(dialogAuthors) as author}
              <button
                class="badge badge-secondary badge-sm gap-1 hover:badge-error"
                onclick={() => toggleAuthor(author)}
              >
                {author} <span>×</span>
              </button>
            {/each}
            <button
              class="text-[10px] uppercase font-bold text-error ml-1 hover:underline"
              onclick={clearDialogFilters}
            >
              Limpiar filtros
            </button>
          </div>
        {/if}
      </div>

      <!-- Hint / count on the left, Avanzado on the right — same row, anchored. -->
      <div class="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
        {#if dialogSearchTerms.length === 0 && dialogAuthors.size === 0 && dialogTags.size === 0}
          <span class="opacity-70">Escribe para buscar en toda la colección</span>
        {:else if dialogFullResultsCount === 0}
          <span class="badge badge-warning badge-sm gap-1">Sin resultados</span>
        {:else if dialogHasCriteria}
          <span class="badge badge-soft badge-sm gap-1">
            {dialogFullResultsCount} resultado{dialogFullResultsCount === 1 ? '' : 's'}
          </span>
        {/if}
        <button
          type="button"
          class={`btn btn-sm gap-1 ${advancedOpen ? 'btn-primary' : 'btn-ghost'}`}
          onclick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            advancedOpen = !advancedOpen;
          }}
        >
          Avanzado
          {#if dialogActiveFilterCount > 0}
            <span class="badge badge-xs badge-warning">{dialogActiveFilterCount}</span>
          {/if}
          <ChevronDown
            class={`h-3.5 w-3.5 transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {#if advancedOpen}
        <div
          class="mt-4 max-h-[40vh] overflow-y-auto overflow-scroll space-y-5 rounded-box border border-base-200 bg-base-50/60 px-5 py-4"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-widest opacity-50">
                Modo de búsqueda y filtrado
              </p>
              {#if !showSearchHint}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-[10px] opacity-40 hover:opacity-100"
                  onclick={() => (showSearchHint = true)}
                >
                  Mostrar ayuda
                </button>
              {/if}
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class={`btn btn-sm ${dialogMatchMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onclick={() => {
                  dialogMatchMode = 'all';
                }}
              >
                Estricto (Intersección)
              </button>
              <button
                type="button"
                class={`btn btn-sm ${dialogMatchMode === 'any' ? 'btn-primary' : 'btn-outline'}`}
                onclick={() => {
                  dialogMatchMode = 'any';
                }}
              >
                Amplio (Unión)
              </button>
            </div>
            {#if showSearchHint}
              <div class="relative rounded-box bg-base-200/50 p-2 pr-8">
                <p class="text-[10px] opacity-60 leading-tight">
                  Estricto: requiere que coincidan todos los términos y todas las etiquetas
                  seleccionadas.<br />
                  Amplio: muestra resultados que coincidan con al menos un término o etiqueta.<br />
                  <span class="text-primary/70 italic"
                    >* Los autores siempre se filtran por unión (se incluyen todos los
                    seleccionados).</span
                  >
                </p>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle absolute top-1 right-1 h-6 w-6 min-h-0"
                  onclick={() => (showSearchHint = false)}
                  title="Ocultar"
                >
                  ×
                </button>
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-widest opacity-50">Buscar en</p>
            <div class="flex flex-wrap gap-2">
              <label
                class={`btn btn-sm gap-2 ${dialogFields.content ? 'btn-primary' : 'btn-outline'}`}
              >
                <input type="checkbox" class="hidden" bind:checked={dialogFields.content} />
                Contenido
              </label>
              <label
                class={`btn btn-sm gap-2 ${dialogFields.authorBook ? 'btn-primary' : 'btn-outline'}`}
              >
                <input type="checkbox" class="hidden" bind:checked={dialogFields.authorBook} />
                Autor / libro
              </label>
              <label
                class={`btn btn-sm gap-2 ${dialogFields.page ? 'btn-primary' : 'btn-outline'}`}
              >
                <input type="checkbox" class="hidden" bind:checked={dialogFields.page} />
                Página
              </label>
              <label
                class={`btn btn-sm gap-2 ${dialogFields.tags ? 'btn-primary' : 'btn-outline'}`}
              >
                <input type="checkbox" class="hidden" bind:checked={dialogFields.tags} />
                Etiquetas
              </label>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-widest opacity-50">
                Filtrar por etiquetas
              </p>
              {#if dialogTags.size > 0}
                <button
                  type="button"
                  class="text-xs text-primary hover:underline"
                  onclick={() => {
                    dialogTags = new Set();
                  }}>Limpiar</button
                >
              {/if}
            </div>
            <div class="flex flex-wrap gap-x-2 gap-y-3 overflow-y-auto pt-1">
              {#each tags as tag}
                <button
                  type="button"
                  class={`btn btn-xs rounded-full ${dialogTags.has(tag) ? 'btn-primary' : 'btn-outline'}`}
                  onclick={() => toggleTag(tag)}
                >
                  {tag}{dialogTags.has(tag) ? ' ×' : ''}
                </button>
              {/each}
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-widest opacity-50">
                Filtrar por autor
              </p>
              {#if dialogAuthors.size > 0}
                <button
                  type="button"
                  class="text-xs text-primary hover:underline"
                  onclick={() => {
                    dialogAuthors = new Set();
                  }}>Limpiar</button
                >
              {/if}
            </div>
            <div class="flex flex-wrap gap-2 overflow-y-auto">
              {#each authors as author}
                <button
                  type="button"
                  class={`btn btn-xs rounded-full ${dialogAuthors.has(author) ? 'btn-primary' : 'btn-outline'}`}
                  onclick={() => toggleAuthor(author)}
                >
                  {author}{dialogAuthors.has(author) ? ' ×' : ''}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="sm:max-h-[55vh] min-h-25 flex-1 space-y-3 overflow-y-auto px-6 py-5">
      {#if !dialogHasCriteria}
        <p
          class="rounded-box border border-dashed border-base-300 px-4 py-8 text-center text-sm opacity-70"
        >
          Busca en autores, libros, páginas y contenido. Al elegir un resultado, se abrirá su libro
          y se hará scroll a la tarjeta.
        </p>
      {:else if dialogResults.length === 0}
        <p
          class="rounded-box border border-dashed border-base-300 px-4 py-8 text-center text-sm opacity-70"
        >
          No hay coincidencias para esta búsqueda.
        </p>
      {:else}
        {#each dialogResults as card (card.id)}
          <SearchResultItem {card} searchTerms={dialogSearchTerms} onselect={selectSearchResult} />
        {/each}
      {/if}
    </div>
  </div>
  <form class="modal-backdrop" method="dialog">
    <button type="submit">Cerrar</button>
  </form>
</dialog>

<RelatedCardsSheet
  relations={relatedRelations}
  show={relatedSheetOpen}
  onclose={() => (relatedSheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={currentSheetCardId}
/>
