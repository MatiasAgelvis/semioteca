<script lang="ts">
  import { tick } from 'svelte';
  import { ChevronDown } from '@lucide/svelte';

  import SearchResultItem from '$lib/components/SearchResultItem.svelte';
  import Tag from '$lib/components/Tag.svelte';
  import {
    cardsSearchDialogOpen,
    cardsSearchQuery,
    cardsSearchInitialTags,
    closeCardsSearch,
  } from '$lib/stores/cardsSearch';
  import { goto } from '$app/navigation';
  import { buildSearchParams, parseSearchUrl } from '$lib/utils/searchUrl';
  import { tokenizeQuery } from '$lib/utils/search';
  import { getRankedSearchResults } from '$lib/utils/cardsSearch';
  import type { CardRecord } from '$lib/types/content';

  let {
    cards: cardsProp,
    tags: tagsProp,
    authors: authorsProp,
    onselect,
  }: {
    cards?: CardRecord[];
    tags?: string[];
    authors?: string[];
    onselect: (card: CardRecord) => void;
  } = $props();

  // Fetch card data if not provided as props
  let fetchedCards = $state<CardRecord[]>([]);
  let dataLoaded = $state(false);

  const cards = $derived(cardsProp ?? fetchedCards);
  const tags = $derived(
    tagsProp ??
      [...new Set(cards.flatMap((c) => c.tags?.filter((t) => t.trim().length > 0) ?? []))].sort(),
  );
  const authors = $derived(
    authorsProp ??
      [...new Set(cards.map((c) => c.author))].sort((a, b) =>
        a.localeCompare(b, 'es', { sensitivity: 'base' }),
      ),
  );

  // ---------------------------------------------------------------------------
  // Local dialog state
  // ---------------------------------------------------------------------------
  let advancedOpen = $state(false);
  let showSearchHint = $state(false);

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

  // Refs
  let searchDialog: HTMLDialogElement;
  let searchInput: HTMLInputElement;
  let dialogSeeded = false;

  // Debounced query for live preview inside the dialog
  let dialogDebouncedQuery = $state('');
  let dialogDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------------------------------------------------------------------------
  // Sync helpers (dialog draft ↔ committed search state)
  // ---------------------------------------------------------------------------
  function syncDialogFromCommitted() {
    dialogQuery = $cardsSearchQuery;
    dialogDebouncedQuery = $cardsSearchQuery;
    dialogTags = new Set();
    dialogAuthors = new Set();
    dialogMatchMode = 'all';
    dialogFields = { content: true, authorBook: true, page: true, tags: true };
  }

  // ---------------------------------------------------------------------------
  // Derived — dialog-local search pipeline
  // ---------------------------------------------------------------------------
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

  const dialogActiveFilterCount = $derived(
    dialogAuthors.size +
      dialogTags.size +
      (dialogMatchMode === 'any' ? 1 : 0) +
      (!dialogFields.content || !dialogFields.authorBook || !dialogFields.page || !dialogFields.tags
        ? 1
        : 0),
  );

  // ---------------------------------------------------------------------------
  // Toggle / clear helpers
  // ---------------------------------------------------------------------------
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
    dialogFields = { content: true, authorBook: true, page: true, tags: true };
  }

  // ---------------------------------------------------------------------------
  // Commit & open full results (delegates navigation to parent)
  // ---------------------------------------------------------------------------
  function openFullResultsMode() {
    if (!dialogHasCriteria) return;

    closeCardsSearch();

    const sp = buildSearchParams({
      q: dialogQuery || undefined,
      tags: Array.from(dialogTags),
      authors: Array.from(dialogAuthors),
      mode: dialogMatchMode,
    });
    const qs = sp.toString();
    goto(qs ? `/search?${qs}` : '/search');
  }

  function selectSearchResult(card: CardRecord) {
    closeCardsSearch();
    onselect(card);
  }

  // ---------------------------------------------------------------------------
  // Dialog open/close via $effect
  // ---------------------------------------------------------------------------
  $effect(() => {
    if (!searchDialog) return;

    if ($cardsSearchDialogOpen) {
      // Fetch card data if not provided as props
      if (!cardsProp && !dataLoaded) {
        dataLoaded = true;
        fetch('/content/cards.json')
          .then((r) => r.json())
          .then((dataset: { books: Array<{ cards: CardRecord[] }> }) => {
            fetchedCards = dataset.books.flatMap((b) => b.cards);
          })
          .catch(() => {
            dataLoaded = false;
          });
      }

      if (!dialogSeeded) {
        dialogSeeded = true;
        if ($cardsSearchInitialTags.length > 0) {
          dialogQuery = '';
          dialogDebouncedQuery = '';
          dialogTags = new Set($cardsSearchInitialTags);
          dialogAuthors = new Set();
          dialogMatchMode = 'all';
          dialogFields = { content: true, authorBook: true, page: true, tags: true };
        } else if (typeof window !== 'undefined') {
          // Seed from current URL params (e.g. when opened from /search?q=...)
          const urlParams = parseSearchUrl(new URL(window.location.href).searchParams);
          dialogQuery = urlParams.q ?? '';
          dialogDebouncedQuery = dialogQuery;
          dialogTags = new Set(urlParams.tags ?? []);
          dialogAuthors = new Set(urlParams.authors ?? []);
          dialogMatchMode = urlParams.mode ?? 'all';
          dialogFields = { content: true, authorBook: true, page: true, tags: true };
        } else {
          syncDialogFromCommitted();
        }
        cardsSearchInitialTags.set([]);
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
        {#if dialogTags.size > 0 || dialogAuthors.size > 0}
          <div class="flex flex-wrap items-center gap-1.5 pt-1 pb-2 text-xs">
            {#each Array.from(dialogTags) as tag}
              <Tag
                {tag}
                variant="filter"
                hoverColor={dialogTags.has(tag) ? 'error' : 'primary'}
                removable
                onclick={() => toggleTag(tag)}
              />
            {/each}
            {#each Array.from(dialogAuthors) as author}
              <Tag
                tag={author}
                variant="secondary"
                hoverColor={dialogTags.has(author) ? 'error' : 'primary'}
                removable
                onclick={() => toggleAuthor(author)}
              />
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
                <Tag
                  {tag}
                  variant={dialogTags.has(tag) ? 'filter' : 'outline'}
                  removable={dialogTags.has(tag)}
                  hoverColor={dialogTags.has(tag) ? 'error' : 'primary'}
                  onclick={() => toggleTag(tag)}
                />
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
                <Tag
                  tag={author}
                  variant={dialogAuthors.has(author) ? 'secondary' : 'outline'}
                  removable={dialogAuthors.has(author)}
                  hoverColor={dialogAuthors.has(author) ? 'error' : 'primary'}
                  onclick={() => toggleAuthor(author)}
                />
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
          <SearchResultItem
            {card}
            searchTerms={dialogSearchTerms}
            activeTags={[...dialogTags]}
            activeAuthors={[...dialogAuthors]}
            onselect={selectSearchResult}
          />
        {/each}
      {/if}
    </div>
  </div>
  <form class="modal-backdrop" method="dialog">
    <button type="submit">Cerrar</button>
  </form>
</dialog>
