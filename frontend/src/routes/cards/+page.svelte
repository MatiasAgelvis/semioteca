<script lang="ts">
	import { onMount, tick } from 'svelte';

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
		openCardsSearch
	} from '$lib/stores/cardsSearch';
	import { getBookKey } from '$lib/utils/books';
	import { tokenizeQuery } from '$lib/utils/search';
	import { getRankedSearchResults } from '$lib/utils/cardsSearch';
	import type { CardRecord, CardsDataset } from '$lib/types/content';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(true);
	let selectedBook = $state<string | null>(null);
	let fullResultsMode = $state(false);
	let returnToCardId = $state<string | null>(
		typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('cards:returnTo') : null
	);
	let focusedCardId = $state<string | null>(null);
	let mobileDrawerOpen = $state(false);
	let cards = $state<CardRecord[]>([]);

	// Advanced search filters
	let advancedOpen = $state(false);
	let showSearchHint = $state(false);
	let selectedAuthors = $state<Set<string>>(new Set());
	let selectedTags = $state<Set<string>>(new Set());
	let matchMode = $state<'all' | 'any'>('all');
	let searchFields = $state({ content: true, authorBook: true, page: true, tags: true });

	const authors = $derived.by(() => {
		const seen = new Set<string>();
		return cards
			.map((c) => c.author)
			.filter((a) => { if (seen.has(a)) return false; seen.add(a); return true; })
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

	const activeFilterCount = $derived(
		selectedAuthors.size +
			selectedTags.size +
			(matchMode === 'any' ? 1 : 0) +
		(!searchFields.content || !searchFields.authorBook || !searchFields.page || !searchFields.tags ? 1 : 0)
	);

	function toggleAuthor(author: string) {
		const next = new Set(selectedAuthors);
		if (next.has(author)) next.delete(author);
		else next.add(author);
		selectedAuthors = next;
	}

	function toggleTag(tag: string) {
		const next = new Set(selectedTags);
		if (next.has(tag)) next.delete(tag);
		else next.add(tag);
		selectedTags = next;
	}

	function clearAdvancedFilters() {
		selectedAuthors = new Set();
		selectedTags = new Set();
		matchMode = 'all';
		searchFields = { content: true, authorBook: true, page: true, tags: true };
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

	$effect(() => {
		const q = $cardsSearchQuery;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => { debouncedQuery = q; debounceTimer = null; }, 200);
		return () => { if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; } };
	});

	const searchTerms = $derived(tokenizeQuery(debouncedQuery));

	const booksModel = $derived.by(() => {
		const grouped = new Map<string, { key: string; author: string; title: string; count: number }>();
		for (const card of cards) {
			const key = getBookKey(card);
			const existing = grouped.get(key);
			if (existing) {
				existing.count += 1;
				continue;
			}
			grouped.set(key, { key, author: card.author, title: card.book, count: 1 });
		}
		return [...grouped.values()].sort((a, b) => {
			const ac = a.author.localeCompare(b.author, 'es', { sensitivity: 'base' });
			return ac !== 0 ? ac : a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
		});
	});

	const filteredCards = $derived.by(() => {
		if (cards.length === 0) return [];
		// Avoid rendering the entire dataset on first paint before selectedBook is initialized.
		const activeBookKey = selectedBook ?? getBookKey(cards[0]);
		return cards.filter((card) => getBookKey(card) === activeBookKey);
	});

	const hasSearchCriteria = $derived(searchTerms.length > 0 || selectedAuthors.size > 0 || selectedTags.size > 0);

	const rankedSearchResults = $derived.by(() =>
		getRankedSearchResults(cards, searchTerms, selectedAuthors, selectedTags, searchFields, matchMode)
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
		node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
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
		if (!hasSearchCriteria) return;
		fullResultsMode = true;
		closeSearchDialog();
		mobileDrawerOpen = false;
		await tick();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function closeFullResultsMode() {
		fullResultsMode = false;
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
			{ root: null, rootMargin: '-25% 0px -40% 0px', threshold: [0, 0.1, 0.5] }
		);
		for (const card of displayCards) {
			const node = cardElements.get(card.id);
			if (node) observer.observe(node);
		}
		if (displayCards.length > 0 && (!focusedCardId || !displayCards.some((c) => c.id === focusedCardId))) {
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

		window.addEventListener('keydown', handleKeydown);
		void (async () => {
			const response = await fetch('/content/cards.json');
			if (response.ok && !cancelled) {
				const dataset = (await response.json()) as CardsDataset;
				cards = dataset.books.flatMap((book) => book.cards);
			}
			if (!cancelled) {
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

	$effect(() => {
		if (!searchDialog) return;

		if ($cardsSearchDialogOpen) {
			// Handle initial tags if provided
			if ($cardsSearchInitialTags.length > 0) {
				const nextTags = new Set(selectedTags);
				$cardsSearchInitialTags.forEach(tag => nextTags.add(tag));
				selectedTags = nextTags;
				cardsSearchInitialTags.set([]); // Consume them
			}

			if (!searchDialog.open) {
				searchDialog.showModal();
			}
			void tick().then(() => {
				searchInput?.focus();
				if ($cardsSearchQuery) searchInput?.select();
			});
			return;
		}

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
				<button class="btn btn-ghost btn-xs" type="button" onclick={closeFullResultsMode}>Volver al modo libro</button>
			{:else}
				<span>{filteredCards.length} tarjetas en este libro.</span>
			{/if}
		</div>

		<div class="mt-6">
			<button
				class="btn btn-primary btn-sm fixed right-4 bottom-4 z-30 shadow-lg lg:hidden"
				onclick={() => { mobileDrawerOpen = true; }}
			>
				Filtros y TOC
			</button>
			<div class="drawer drawer-end lg:hidden">
				<input id="cards-mobile-drawer" type="checkbox" class="drawer-toggle" bind:checked={mobileDrawerOpen} />
				<div class="drawer-content"></div>
				<div class="drawer-side z-40">
					<label for="cards-mobile-drawer" class="drawer-overlay" aria-label="Cerrar panel lateral"></label>
					<div class="min-h-full w-80 max-w-[85vw] space-y-4 bg-base-200 p-4">
						<div class="flex items-center justify-between">
							<p class="text-sm font-semibold">Navegacion</p>
							<button class="btn btn-ghost btn-xs" onclick={() => { mobileDrawerOpen = false; }}>
								Cerrar
							</button>
						</div>
						<BookSidebar
							books={booksModel}
							selectedBook={selectedBook ?? ''}
							onselect={selectBook}
						/>
						<CardsToc
							cards={displayCards}
							{focusedCardId}
							searchTerms={fullResultsMode ? searchTerms : []}
							onscrollto={handleTocScroll}
						/>
					</div>
				</div>
			</div>

			<div class={`grid gap-6 ${fullResultsMode ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-[18rem_minmax(0,1fr)_18rem]'}`}>
				{#if !fullResultsMode}
					<div class="hidden lg:block">
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
							/>
						{/each}
						{#if displayCards.length === 0}
							<p class="text-sm">No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.</p>
						{/if}
					{/if}
				</div>

				<div class="hidden lg:block">
					<CardsToc
						cards={displayCards}
						{focusedCardId}
						searchTerms={fullResultsMode ? searchTerms : []}
						onscrollto={scrollToCard}
					/>
				</div>
			</div>
		</div>
	</PageSection>
</div>

<dialog
	bind:this={searchDialog}
	class="modal"
	onclose={() => { advancedOpen = false; closeCardsSearch(); }}
>
	<div class="modal-box flex flex-col overflow-visible max-w-3xl rounded-4xl border border-base-300 bg-base-100 p-0 shadow-2xl">
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
				<label class="block">
					<input
						bind:this={searchInput}
						bind:value={$cardsSearchQuery}
						class="input input-lg input-bordered w-full truncate"
						placeholder="Busca por autor, libro, página, etiquetas o fragmento"
						type="search"
					/>
				</label>
				{#if selectedTags.size > 0 || selectedAuthors.size > 0}
					<div class="flex flex-wrap gap-1.5 pt-1">
						{#each Array.from(selectedTags) as tag}
							<button
								class="badge badge-primary badge-sm gap-1 hover:badge-error"
								onclick={() => toggleTag(tag)}
							>
								{tag} <span>×</span>
							</button>
						{/each}
						{#each Array.from(selectedAuthors) as author}
							<button
								class="badge badge-secondary badge-sm gap-1 hover:badge-error"
								onclick={() => toggleAuthor(author)}
							>
								{author} <span>×</span>
							</button>
						{/each}
						<button
							class="text-[10px] uppercase font-bold text-error ml-1 hover:underline"
							onclick={clearAdvancedFilters}
						>
							Limpiar filtros
						</button>
					</div>
				{/if}
			</div>

			<div class="mt-3 flex items-center justify-between gap-3">
				<div
					class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
				>
					{#if searchTerms.length === 0 && selectedAuthors.size === 0 && selectedTags.size === 0}
						<span>Escribe para buscar en toda la colección</span>
					{:else if hasSearchCriteria}
						<button
							type="button"
							class="btn btn-xs btn-primary"
							disabled={fullResultsCount === 0}
							onclick={openFullResultsMode}
						>
							Ver todos ({fullResultsCount})
						</button>
					{/if}
				</div>
				<div class="flex items-center justify-end gap-2">
					<button
						type="button"
						class={`btn btn-xs gap-1 ${advancedOpen ? "btn-primary" : "btn-ghost"}`}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							advancedOpen = !advancedOpen;
						}}
					>
						Avanzado
						{#if activeFilterCount > 0}
							<span class="badge badge-xs badge-warning"
								>{activeFilterCount}</span
							>
						{/if}
						<span
							class={`text-xs transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
							>▾</span
						>
					</button>
				</div>
			</div>

			{#if advancedOpen}
				<div
					class="mt-4 max-h-[40vh] overflow-y-auto overflow-scroll space-y-5 rounded-2xl border border-base-200 bg-base-50/60 px-5 py-4"
				>
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p
								class="text-xs font-semibold uppercase tracking-widest opacity-50"
							>
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
								class={`btn btn-sm ${matchMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
								onclick={() => { matchMode = 'all'; }}
							>
								Estricto (Intersección)
							</button>
							<button
								type="button"
								class={`btn btn-sm ${matchMode === "any" ? "btn-primary" : "btn-outline"}`}
								onclick={() => {
									matchMode = "any";
								}}
							>
								Amplio (Unión)
							</button>
						</div>
						{#if showSearchHint}
							<div
								class="relative rounded-lg bg-base-200/50 p-2 pr-8"
							>
								<p class="text-[10px] opacity-60 leading-tight">
									Estricto: requiere que coincidan todos los
									términos y todas las etiquetas
									seleccionadas.<br />
									Amplio: muestra resultados que coincidan con
									al menos un término o etiqueta.<br />
									<span class="text-primary/70 italic"
										>* Los autores siempre se filtran por
										unión (se incluyen todos los
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
						<p
							class="text-xs font-semibold uppercase tracking-widest opacity-50"
						>
							Buscar en
						</p>
						<div class="flex flex-wrap gap-2">
							<label
								class={`btn btn-sm gap-2 ${searchFields.content ? "btn-primary" : "btn-outline"}`}
							>
								<input
									type="checkbox"
									class="hidden"
									bind:checked={searchFields.content}
								/>
								Contenido
							</label>
							<label
								class={`btn btn-sm gap-2 ${searchFields.authorBook ? "btn-primary" : "btn-outline"}`}
							>
								<input
									type="checkbox"
									class="hidden"
									bind:checked={searchFields.authorBook}
								/>
								Autor / libro
							</label>
							<label
								class={`btn btn-sm gap-2 ${searchFields.page ? "btn-primary" : "btn-outline"}`}
							>
								<input
									type="checkbox"
									class="hidden"
									bind:checked={searchFields.page}
								/>
								Página
							</label>
							<label
								class={`btn btn-sm gap-2 ${searchFields.tags ? "btn-primary" : "btn-outline"}`}
							>
								<input
									type="checkbox"
									class="hidden"
									bind:checked={searchFields.tags}
								/>
								Etiquetas
							</label>
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p
								class="text-xs font-semibold uppercase tracking-widest opacity-50"
							>
								Filtrar por etiquetas
							</p>
							{#if selectedTags.size > 0}
								<button
									type="button"
									class="text-xs text-primary hover:underline"
									onclick={() => {
										selectedTags = new Set();
									}}>Limpiar</button
								>
							{/if}
						</div>
						<div
							class="flex flex-wrap gap-x-2 gap-y-3 overflow-y-auto pt-1"
						>
							{#each tags as tag}
								<button
									type="button"
									class={`btn btn-xs rounded-full ${selectedTags.has(tag) ? "btn-primary" : "btn-outline"}`}
									onclick={() => toggleTag(tag)}
								>
									{tag}{selectedTags.has(tag) ? " ×" : ""}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p
								class="text-xs font-semibold uppercase tracking-widest opacity-50"
							>
								Filtrar por autor
							</p>
							{#if selectedAuthors.size > 0}
								<button
									type="button"
									class="text-xs text-primary hover:underline"
									onclick={() => {
										selectedAuthors = new Set();
									}}>Limpiar</button
								>
							{/if}
						</div>
						<div
							class="flex flex-wrap gap-2 overflow-y-auto"
						>
							{#each authors as author}
								<button
									type="button"
									class={`btn btn-xs rounded-full ${selectedAuthors.has(author) ? 'btn-primary' : 'btn-outline'}`}
									onclick={() => toggleAuthor(author)}
								>
									{author}{selectedAuthors.has(author) ? ' ×' : ''}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="max-h-[55vh] min-h-25 flex-1 space-y-3 overflow-y-auto px-6 py-5">
			{#if !hasSearchCriteria}
				<p class="rounded-2xl border border-dashed border-base-300 px-4 py-8 text-center text-sm opacity-70">
					Busca en autores, libros, páginas y contenido. Al elegir un resultado, se abrirá su libro y se hará scroll a la tarjeta.
				</p>
			{:else if searchResults.length === 0}
				<p class="rounded-2xl border border-dashed border-base-300 px-4 py-8 text-center text-sm opacity-70">
					No hay coincidencias para esta búsqueda.
				</p>
			{:else}
				{#each searchResults as card (card.id)}
					<SearchResultItem {card} {searchTerms} onselect={selectSearchResult} />
				{/each}
			{/if}
		</div>
	</div>
	<form class="modal-backdrop" method="dialog">
		<button type="submit">Cerrar</button>
	</form>
</dialog>
