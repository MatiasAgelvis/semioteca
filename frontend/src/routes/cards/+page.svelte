<script lang="ts">
	import { onMount, tick } from 'svelte';

	import PageSection from '$lib/components/PageSection.svelte';
	import BookSidebar from '$lib/components/BookSidebar.svelte';
	import CardItem from '$lib/components/CardItem.svelte';
	import CardsToc from '$lib/components/CardsToc.svelte';
	import { getBookKey } from '$lib/utils/books';
	import type { CardRecord, CardsDataset } from '$lib/types/content';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading = $state(true);
	let query = $state('');
	let selectedBook = $state('all');
	let focusedCardId = $state<string | null>(null);
	let cards = $state<CardRecord[]>([]);

	let observer: IntersectionObserver | null = null;
	const cardElements = new Map<string, HTMLElement>();
	const visibleCardIds = new Set<string>();
	let focusLockCardId: string | null = null;
	let focusLockTimeout: ReturnType<typeof setTimeout> | null = null;

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
		const q = query.trim().toLowerCase();
		return cards.filter((card) => {
			if (selectedBook !== 'all' && getBookKey(card) !== selectedBook) return false;
			if (!q) return true;
			return [card.title, card.author, card.book, card.page ?? '', card.content]
				.join(' ').toLowerCase().includes(q);
		});
	});

	function registerCard(el: HTMLElement, id: string) {
		cardElements.set(id, el);
		observer?.observe(el);
	}

	function unregisterCard(el: HTMLElement, id: string) {
		observer?.unobserve(el);
		cardElements.delete(id);
	}

	function scrollToCard(id: string) {
		const node = cardElements.get(id) ?? document.getElementById(`card-${id}`);
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
			observer?.disconnect();
			if (focusLockTimeout) clearTimeout(focusLockTimeout);
		};
	});

	$effect(() => { if (!loading) void setupObserver(); });
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
			<label class="space-y-2">
				<span class="text-sm font-semibold">Buscar en título, libro, autor y contenido</span>
				<input
					class="input input-bordered w-full"
					placeholder="Ej: pragmática, Putnam, p. 34"
					type="search"
					bind:value={query}
				/>
			</label>
			<div class="flex items-center rounded-xl border border-base-300 bg-base-200 px-4 py-3">
				<p class="text-sm opacity-70">Mostrando <strong>{filteredCards.length}</strong> de {data.totalCards} tarjetas.</p>
			</div>
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
			<BookSidebar
				{books}
				{selectedBook}
				totalCards={data.totalCards}
				onselect={(key) => { selectedBook = key; }}
			/>

			<div class="space-y-5">
				{#if loading}
					<p>Cargando tarjetas...</p>
				{:else}
					{#each filteredCards as card}
						<CardItem
							{card}
							focused={focusedCardId === card.id}
							onregister={registerCard}
							onunregister={unregisterCard}
						/>
					{/each}
					{#if filteredCards.length === 0}
						<p class="text-sm">No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.</p>
					{/if}
				{/if}
			</div>

			<CardsToc
				cards={filteredCards}
				{focusedCardId}
				onscrollto={scrollToCard}
			/>
		</div>
	</PageSection>
</div>
