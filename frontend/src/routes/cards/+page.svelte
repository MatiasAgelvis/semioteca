<script lang="ts">
	import { onMount, tick } from 'svelte';

	import PageSection from '$lib/components/PageSection.svelte';
	import BookSidebar from '$lib/components/BookSidebar.svelte';
	import CardItem from '$lib/components/CardItem.svelte';
	import CardsToc from '$lib/components/CardsToc.svelte';
	import SearchResultItem from '$lib/components/SearchResultItem.svelte';
	import { getBookKey } from '$lib/utils/books';
	import { getMatchCount, matchesAllTerms, tokenizeQuery } from '$lib/utils/search';
	import type { CardRecord, CardsDataset } from '$lib/types/content';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(true);
	let selectedBook = $state<string | null>(null);
	let focusedCardId = $state<string | null>(null);
	let mobileDrawerOpen = $state(false);
	let cards = $state<CardRecord[]>([]);
	let searchDialogOpen = $state(false);
	let searchQuery = $state('');

	let observer: IntersectionObserver | null = null;
	let searchDialog: HTMLDialogElement;
	let searchInput: HTMLInputElement;
	const cardElements = new Map<string, HTMLElement>();
	const visibleCardIds = new Set<string>();
	let focusLockCardId: string | null = null;
	let focusLockTimeout: ReturnType<typeof setTimeout> | null = null;
	const searchTerms = $derived(tokenizeQuery(searchQuery));

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
		return cards.filter((card) => !selectedBook || getBookKey(card) === selectedBook);
	});

	const searchResults = $derived.by(() => {
		const terms = searchTerms;
		if (terms.length === 0) return [] as CardRecord[];

		return cards
			.map((card, index) => ({
				card,
				index,
				searchableText: [card.title, card.author, card.book, card.page ?? '', card.content].join(' ')
			}))
			.filter(({ searchableText }) => matchesAllTerms(searchableText, terms))
			.map(({ card, index, searchableText }) => ({
				card,
				index,
				score:
					getMatchCount(card.title, terms) * 8 +
					getMatchCount(card.author, terms) * 6 +
					getMatchCount(card.book, terms) * 5 +
					getMatchCount(card.page ?? '', terms) * 4 +
					getMatchCount(searchableText, terms)
			}))
			.sort((left, right) => {
				if (right.score !== left.score) return right.score - left.score;
				return left.index - right.index;
			})
			.slice(0, 18)
			.map(({ card }) => card);
	});

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
		const cardIndex = filteredCards.findIndex((card) => card.id === id);
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
		node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
	}

	function selectBook(key: string) {
		selectedBook = key;
		mobileDrawerOpen = false;
	}

	async function openSearchDialog() {
		if (!searchDialog) return;
		searchDialog.showModal();
		searchDialogOpen = true;
		await tick();
		searchInput?.focus();
		searchInput?.select();
	}

	function closeSearchDialog() {
		if (!searchDialog?.open) return;
		searchDialog.close();
		searchDialogOpen = false;
	}

	async function selectSearchResult(card: CardRecord) {
		selectedBook = getBookKey(card);
		closeSearchDialog();
		await tick();
		await scrollToCard(card.id);
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
		for (const card of filteredCards) {
			const node = cardElements.get(card.id);
			if (node) observer.observe(node);
		}
		if (filteredCards.length > 0 && (!focusedCardId || !filteredCards.some((c) => c.id === focusedCardId))) {
			focusedCardId = filteredCards[0].id;
		}
	}

	onMount(() => {
		let cancelled = false;
		const handleKeydown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				void openSearchDialog();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		void (async () => {
			const response = await fetch('/content/cards.json');
			if (response.ok && !cancelled) {
				const dataset = (await response.json()) as CardsDataset;
				cards = dataset.books.flatMap((book) => book.cards);
			}
			if (!cancelled) { loading = false; await setupObserver(); }
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
			selectedBook = books[0].key;
		}
	});

	$effect(() => {
		if (loading) return;
		selectedBook;
		filteredCards.length;
		void setupObserver();
	});
</script>

<svelte:head>
	<title>Tarjetas | Semioteca</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection
		title="Repositorio de tarjetas"
		description="Búsqueda y navegación por fichas bibliográficas extraídas de los manuscritos fuente."
	>
		<div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
			<div class="space-y-2">
				<span class="text-sm font-semibold">Explorar el libro seleccionado</span>
				<div class="flex flex-wrap gap-2">
					<button class="btn btn-primary" type="button" onclick={() => { void openSearchDialog(); }}>
						Buscar en todas las tarjetas
					</button>
					<span class="badge badge-ghost h-auto px-3 py-2">⌘K / Ctrl+K</span>
				</div>
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
					<span>{filteredCards.length} tarjetas en este libro</span>
					<span>La búsqueda global abre un popup con vistas previas y resaltado</span>
				</div>
			</div>
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

			<div class="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
				<div class="hidden lg:block">
					<BookSidebar
						{books}
						selectedBook={selectedBook ?? ''}
						onselect={selectBook}
					/>
				</div>

				<div class="space-y-5">
					{#if loading}
						<p>Cargando tarjetas...</p>
					{:else}
						{#each filteredCards as card (card.id)}
							<CardItem
								{card}
								focused={focusedCardId === card.id}
								searchTerms={[]}
								onregister={registerCard}
								onunregister={unregisterCard}
							/>
						{/each}
						{#if filteredCards.length === 0}
							<p class="text-sm">No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.</p>
						{/if}
					{/if}
				</div>

				<div class="hidden lg:block">
					<CardsToc
						cards={filteredCards}
						{focusedCardId}
						searchTerms={[]}
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
	onclose={() => { searchDialogOpen = false; }}
>
	<div class="modal-box max-w-3xl rounded-4xl border border-base-300 bg-base-100 p-0 shadow-2xl">
		<div class="border-b border-base-200 px-6 py-5">
			<div class="flex items-center justify-between gap-3">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] opacity-50">Busqueda global</p>
					<h3 class="mt-1 text-xl font-black">Buscar en todas las tarjetas</h3>
				</div>
				<form method="dialog">
					<button class="btn btn-ghost btn-sm" type="submit">Cerrar</button>
				</form>
			</div>
			<label class="mt-4 block">
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					class="input input-lg input-bordered w-full"
					placeholder="Busca por autor, libro, página o fragmento"
					type="search"
				/>
			</label>
			<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
				{#if searchTerms.length === 0}
					<span>Escribe para buscar en toda la colección</span>
				{:else}
					<span>{searchResults.length} resultados visibles</span>
					<span>Coincidencia sin acentos y con resaltado</span>
				{/if}
			</div>
		</div>

		<div class="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-5">
			{#if searchTerms.length === 0}
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
