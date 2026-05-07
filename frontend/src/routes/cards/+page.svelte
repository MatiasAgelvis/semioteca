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
	import { countMatchedTerms, getMatchCount, matchesAllTerms, matchesAnyTerm, tokenizeQuery } from '$lib/utils/search';
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
	let showSearchHint = $state(true);
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

	const books = $derived.by(() => {
		const grouped = new Map<string, { key: string; author: string; title: string; count: number }>();
		for (const card of cards) {
			const key = getBookKey(card);
			const existing = grouped.get(key);
			if (existing) { existing.count += 1; continue; }
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

	const rankedSearchResults = $derived.by(() => {
		const terms = searchTerms;
		const hasFilters = selectedAuthors.size > 0 || selectedTags.size > 0;
		if (terms.length === 0 && !hasFilters) return [] as CardRecord[];

		const matchFn = matchMode === 'all' ? matchesAllTerms : matchesAnyTerm;

		return cards
			.map((card, index) => {
				const parts: string[] = [];
				if (searchFields.authorBook) parts.push(card.author, card.book);
				if (searchFields.page) parts.push(card.page ?? '');
				if (searchFields.content) parts.push(card.content);
				if (searchFields.tags && card.tags) parts.push(...card.tags);
				return { card, index, searchableText: parts.join(' ') };
			})
			.filter(({ card, searchableText }) => {
				if (selectedAuthors.size > 0 && !selectedAuthors.has(card.author)) return false;
				if (selectedTags.size > 0) {
					const cardTags = card.tags ?? [];
					if (matchMode === 'all') {
						if (!Array.from(selectedTags).every((tag) => cardTags.includes(tag))) return false;
					} else {
						if (!cardTags.some((tag) => selectedTags.has(tag))) return false;
					}
				}
				if (terms.length === 0) return true;
				return matchFn(searchableText, terms);
			})
			.map(({ card, index, searchableText }) => ({
				card,
				index,
				score: (() => {
					// Coverage bonus: rewards cards that match more distinct terms (0–20 pts)
					const coverageBonus = terms.length > 0
						? (countMatchedTerms(searchableText, terms) / terms.length) * 20
						: 0;
					// Per-field scores, capped to avoid length bias in long content
					const authorScore = searchFields.authorBook ? Math.min(getMatchCount(card.author, terms), 3) * 6 : 0;
					const bookScore = searchFields.authorBook ? Math.min(getMatchCount(card.book, terms), 3) * 5 : 0;
					const pageScore = searchFields.page ? Math.min(getMatchCount(card.page ?? '', terms), 3) * 4 : 0;
					const tagScore = (searchFields.tags && card.tags) ? Math.min(card.tags.reduce((sum, t) => sum + getMatchCount(t, terms), 0), 3) * 5 : 0;
					const contentScore = searchFields.content ? Math.min(getMatchCount(card.content, terms), 5) : 0;
					return coverageBonus + authorScore + bookScore + pageScore + tagScore + contentScore;
				})()
			}))
			.sort((left, right) => {
				if (right.score !== left.score) return right.score - left.score;
				return left.index - right.index;
			})
			.map(({ card }) => card);
	});

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
				// Pick the topmost visible card among all currently visible ones
				let topmost: string | null = null;
				let topmostY = Infinity;
				for (const id of visibleCardIds) {
					const el = cardElements.get(id);
					if (!el) continue;
					const y = el.getBoundingClientRect().top;
					if (y < topmostY) { topmostY = y; topmost = id; }
				}
				if (topmost) focusedCardId = topmost;
				else if (filteredCards.length > 0) focusedCardId = filteredCards[0].id;
			},
			{ root: null, rootMargin: '-20% 0px -60% 0px', threshold: [0.05, 0.25, 0.6] }
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
		books.length;
		if (books.length === 0) {
			selectedBook = null;
			return;
		}
		if (!selectedBook || !books.some((book) => book.key === selectedBook)) {
			// If restoring a card, pick its book; otherwise default to first book
			if (returnToCardId) {
				const target = cards.find((c) => c.id === returnToCardId);
				if (target) { selectedBook = getBookKey(target); return; }
			}
			selectedBook = books[0].key;
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
				<span>{filteredCards.length} tarjetas en este libro</span>
				<span>Usa la barra fija del encabezado para buscar en toda la colección</span>
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
							{books}
							selectedBook={selectedBook ?? ''}
							onselect={selectBook}
						/>
						<CardsToc
							cards={filteredCards}
							{focusedCardId}
							searchTerms={[]}
							onscrollto={handleTocScroll}
						/>
					</div>
				</div>
			</div>

			<div class={`grid gap-6 ${fullResultsMode ? '' : 'lg:grid-cols-[17rem_minmax(0,1fr)_20rem]'}`}>
				{#if !fullResultsMode}
				<div class="hidden lg:block">
					<BookSidebar
						{books}
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

				{#if !fullResultsMode}
				<div class="hidden lg:block">
					<CardsToc
						cards={displayCards}
						{focusedCardId}
						searchTerms={fullResultsMode ? searchTerms : []}
						onscrollto={scrollToCard}
					/>
				</div>
				{/if}
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
					<p class="text-xs font-semibold uppercase tracking-[0.22em] opacity-50">Busqueda global</p>
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
						class="input input-lg input-bordered w-full"
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
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
					{#if searchTerms.length === 0 && selectedAuthors.size === 0 && selectedTags.size === 0}
						<span>Escribe para buscar en toda la colección</span>
					{:else}
						<span>{fullResultsCount} resultados</span>
						{#if activeFilterCount > 0}
							<button class="text-primary hover:underline" type="button" onclick={clearAdvancedFilters}>
								{activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'} ×
							</button>
						{/if}
					{/if}
				</div>
				<div class="flex items-center gap-2">
					{#if hasSearchCriteria && fullResultsCount > 0}
						<button type="button" class="btn btn-xs btn-primary" onclick={openFullResultsMode}>
							Ver todos ({fullResultsCount})
						</button>
					{/if}
					<button
						type="button"
						class={`btn btn-xs gap-1 ${advancedOpen ? 'btn-primary' : 'btn-ghost'}`}
						onclick={(e) => { 
							e.preventDefault();
							e.stopPropagation();
							advancedOpen = !advancedOpen; 
						}}
					>
						Avanzado
						{#if activeFilterCount > 0}
							<span class="badge badge-xs badge-warning">{activeFilterCount}</span>
						{/if}
						<span class={`text-xs transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}>▾</span>
					</button>
				</div>
			</div>

			{#if advancedOpen}
				<div class="mt-4 shrink-0 space-y-5 rounded-2xl border border-base-200 bg-base-50/60 px-5 py-4">

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-widest opacity-50">Modo de búsqueda y filtrado</p>
							{#if !showSearchHint}
								<button 
									type="button"
									class="btn btn-ghost btn-xs text-[10px] opacity-40 hover:opacity-100" 
									onclick={() => showSearchHint = true}
								>
									Mostrar ayuda
								</button>
							{/if}
						</div>
						<div class="flex gap-2">
							<button
								type="button"
								class={`btn btn-sm ${matchMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
								onclick={() => { matchMode = 'all'; }}
							>
								Estricto (Intersección)
							</button>
							<button
								type="button"
								class={`btn btn-sm ${matchMode === 'any' ? 'btn-primary' : 'btn-outline'}`}
								onclick={() => { matchMode = 'any'; }}
							>
								Amplio (Unión)
							</button>
						</div>
{#if showSearchHint}
							<div class="relative rounded-lg bg-base-200/50 p-2 pr-8">
								<p class="text-[10px] opacity-60 leading-tight">
									Estricto: requiere que coincidan todos los términos y todas las etiquetas seleccionadas.<br/>
									Amplio: muestra resultados que coincidan con al menos un término o etiqueta.<br/>
									<span class="text-primary/70 italic">* Los autores siempre se filtran por unión (se incluyen todos los seleccionados).</span>
								</p>
								<button 
									type="button"
									class="btn btn-ghost btn-xs btn-circle absolute top-1 right-1 h-6 w-6 min-h-0" 
									onclick={() => showSearchHint = false}
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
							<label class={`btn btn-sm gap-2 ${searchFields.content ? 'btn-primary' : 'btn-outline'}`}>
								<input type="checkbox" class="hidden" bind:checked={searchFields.content} />
								Contenido
							</label>
							<label class={`btn btn-sm gap-2 ${searchFields.authorBook ? 'btn-primary' : 'btn-outline'}`}>
								<input type="checkbox" class="hidden" bind:checked={searchFields.authorBook} />
								Autor / libro
							</label>
							<label class={`btn btn-sm gap-2 ${searchFields.page ? 'btn-primary' : 'btn-outline'}`}>
								<input type="checkbox" class="hidden" bind:checked={searchFields.page} />
								Página
							</label>
							<label class={`btn btn-sm gap-2 ${searchFields.tags ? 'btn-primary' : 'btn-outline'}`}>
								<input type="checkbox" class="hidden" bind:checked={searchFields.tags} />
								Etiquetas
							</label>
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-widest opacity-50">Filtrar por etiquetas</p>
							{#if selectedTags.size > 0}
								<button
									type="button"
									class="text-xs text-primary hover:underline"
									onclick={() => { selectedTags = new Set(); }}
								>Limpiar</button>
							{/if}
						</div>
						<div class="flex max-h-32 flex-wrap gap-x-2 gap-y-3 overflow-y-auto pt-1">
							{#each tags as tag}
								<button
									type="button"
									class={`btn btn-xs rounded-full ${selectedTags.has(tag) ? 'btn-primary' : 'btn-outline'}`}
									onclick={() => toggleTag(tag)}
								>
									{tag}{selectedTags.has(tag) ? ' ×' : ''}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-widest opacity-50">Filtrar por autor</p>
							{#if selectedAuthors.size > 0}
								<button
									type="button"
									class="text-xs text-primary hover:underline"
									onclick={() => { selectedAuthors = new Set(); }}
								>Limpiar</button>
							{/if}
						</div>
						<div class="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
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
			{#if searchTerms.length === 0 && selectedAuthors.size === 0}
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
