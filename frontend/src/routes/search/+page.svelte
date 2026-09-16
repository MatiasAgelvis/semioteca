<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CardItem from '$lib/components/CardItem.svelte';
  import CardsToc from '$lib/components/CardsToc.svelte';
  import Tag from '$lib/components/Tag.svelte';
  import { tokenizeQuery } from '$lib/utils/search';
  import { showToast } from '$lib/stores/toast';
  import { Share } from '@lucide/svelte';
  import { getRankedSearchResults } from '$lib/utils/cardsSearch';
  import { parseSearchUrl, buildSearchParams } from '$lib/utils/searchUrl';
  import { useCardObserver } from '$lib/utils/cardObserver.svelte';
  import type { CardRecord, CardsDataset } from '$lib/types/content';

  let loading = $state(true);
  let cards = $state<CardRecord[]>([]);
  const cardObs = useCardObserver();
  const canSystemShare = $derived(typeof navigator !== 'undefined' && !!navigator.share);
  let query = $state('');
  let selectedTags = $state<Set<string>>(new Set());
  let selectedAuthors = $state<Set<string>>(new Set());
  let matchMode = $state<'all' | 'any'>('all');
  let searchFields = $state({
    content: true,
    authorBook: true,
    page: true,
    tags: true,
  });

  // Debounced query for live search
  let debouncedQuery = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const q = query;
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

  const hasSearchCriteria = $derived(
    searchTerms.length > 0 || selectedAuthors.size > 0 || selectedTags.size > 0,
  );

  const rankedResults = $derived.by(() =>
    getRankedSearchResults(
      cards,
      searchTerms,
      selectedAuthors,
      selectedTags,
      searchFields,
      matchMode,
    ),
  );

  const resultCount = $derived(rankedResults.length);

  // Sync local state to URL when search params change
  function updateUrl() {
    const sp = buildSearchParams({
      q: debouncedQuery || undefined,
      tags: Array.from(selectedTags),
      authors: Array.from(selectedAuthors),
      mode: matchMode,
    });
    const qs = sp.toString();
    const url = qs ? `/search?${qs}` : '/search';
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  $effect(() => {
    // Track reactive deps
    debouncedQuery;
    selectedTags.size;
    selectedAuthors.size;
    matchMode;
    if (!loading) {
      updateUrl();
    }
  });

  // Re-observe when results change
  $effect(() => {
    if (loading) return;
    rankedResults.length;
    void cardObs.setupObserver(rankedResults);
  });

  function removeTag(tag: string) {
    const next = new Set(selectedTags);
    next.delete(tag);
    selectedTags = next;
  }

  function removeAuthor(author: string) {
    const next = new Set(selectedAuthors);
    next.delete(author);
    selectedAuthors = next;
  }

  function clearAllFilters() {
    query = '';
    debouncedQuery = '';
    selectedTags = new Set();
    selectedAuthors = new Set();
    matchMode = 'all';
  }

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      document.getElementById('search-share')?.hidePopover();
      showToast('Enlace copiado', 'success');
    } catch {
      /* clipboard not available */
    }
  }

  async function handleSystemShare() {
    document.getElementById('search-share')?.hidePopover();
    try {
      await navigator.share({ title: document.title, url: window.location.href });
    } catch {
      /* cancelled or not supported */
    }
  }

  function handleTocScroll(id: string) {
    const el = document.getElementById(`card-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onMount(() => {
    const urlParams = parseSearchUrl($page.url.searchParams);
    if (urlParams.q) query = urlParams.q;
    if (urlParams.tags) selectedTags = new Set(urlParams.tags);
    if (urlParams.authors) selectedAuthors = new Set(urlParams.authors);
    if (urlParams.mode) matchMode = urlParams.mode;

    // Fetch card data
    fetch('/content/cards.json')
      .then((r) => r.json())
      .then((dataset: CardsDataset) => {
        cards = dataset.books.flatMap((b) => b.cards);
        loading = false;
        cardObs.setupObserver(rankedResults);
      })
      .catch(() => {
        loading = false;
      });

    return () => {
      cardObs.destroy();
    };
  });
</script>

<svelte:head>
  <title>Resultados de búsqueda | Significado Total</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 lg:px-10">
  <div class="flex items-center justify-between">
    <a href="/cards" class="btn btn-outline btn-sm gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        ><path
          fill-rule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clip-rule="evenodd"
        /></svg
      >
      Volver al repositorio
    </a>
  </div>

  <h1 class="text-2xl font-black">Resultados de búsqueda</h1>

  <!-- Active filter chips + clear -->
  {#if selectedTags.size > 0 || selectedAuthors.size > 0}
    <div class="flex flex-wrap items-center gap-1.5 text-xs">
      {#each Array.from(selectedTags) as tag}
        <Tag {tag} removable variant="filter" onclick={() => removeTag(tag)} />
      {/each}
      {#each Array.from(selectedAuthors) as author}
        <Tag tag={author} removable variant="filter" onclick={() => removeAuthor(author)} />
      {/each}
      <button
        class="text-[10px] uppercase font-bold text-error hover:underline"
        type="button"
        onclick={clearAllFilters}
      >
        Limpiar filtros
      </button>
    </div>
  {/if}

  <!-- Results summary + share -->
  {#if !loading && hasSearchCriteria}
    <div class="flex items-center gap-3 text-sm opacity-70">
      <span>{resultCount} resultado{resultCount === 1 ? '' : 's'}</span>
      <button
        popovertarget="search-share"
        class="btn btn-ghost btn-xs shrink-0 gap-1"
        aria-label="Compartir búsqueda"
      >
        <Share class="h-4 w-4" aria-hidden="true" />
        <span class="hidden md:inline">Compartir</span>
      </button>
      <ul class="dropdown menu w-56 rounded-box bg-base-100 p-2 shadow" popover id="search-share">
        <li>
          <button type="button" class="btn btn-ghost btn-sm justify-start" onclick={copyShareUrl}
            >Copiar enlace</button
          >
        </li>
        {#if canSystemShare}
          <li>
            <button
              type="button"
              class="btn btn-ghost btn-sm justify-start"
              onclick={handleSystemShare}>Compartir con el sistema…</button
            >
          </li>
        {/if}
      </ul>
    </div>
  {/if}

  <!-- Results with TOC -->
  {#if !loading && hasSearchCriteria}
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="space-y-3">
        {#each rankedResults as card (card.id)}
          <CardItem
            {card}
            focused={cardObs.focusedCardId === card.id}
            {searchTerms}
            onregister={(_el, id) => cardObs.register(id, _el)}
            onunregister={(_el, id) => cardObs.unregister(id)}
          />
        {/each}
      </div>

      <div class="hidden lg:block min-w-0">
        <CardsToc
          cards={rankedResults}
          focusedCardId={cardObs.focusedCardId}
          {searchTerms}
          onscrollto={handleTocScroll}
        />
      </div>
    </div>
  {/if}
</div>
