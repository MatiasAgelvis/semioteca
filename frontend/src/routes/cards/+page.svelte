<script lang="ts">
	import { onMount, tick } from 'svelte';

	import PageSection from '$lib/components/PageSection.svelte';
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

	const books = $derived(data.books);
	const filteredCards = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return cards.filter((card) => {
			if (selectedBook !== 'all') {
				const cardKey = `${card.author}-${card.year}-${card.book}`;
				if (cardKey !== selectedBook) {
					return false;
				}
			}
			if (!q) {
				return true;
			}
			const searchable = [card.title, card.author, card.book, card.page ?? '', card.content]
				.join(' ')
				.toLowerCase();
			return searchable.includes(q);
		});
	});

	function trackCard(node: HTMLElement, cardId: string) {
		cardElements.set(cardId, node);
		if (observer) {
			observer.observe(node);
		}

		return {
			destroy() {
				if (observer) {
					observer.unobserve(node);
				}
				cardElements.delete(cardId);
			}
		};
	}

	function scrollToCard(cardId: string) {
		const node = cardElements.get(cardId);
		if (!node) {
			return;
		}

		focusedCardId = cardId;
		node.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	async function setupObserver() {
		if (typeof window === 'undefined' || loading) {
			return;
		}

		await tick();

		if (observer) {
			observer.disconnect();
		}

		observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible.length === 0) {
					return;
				}

				const cardId = visible[0]?.target.getAttribute('data-card-id');
				if (cardId) {
					focusedCardId = cardId;
				}
			},
			{
				root: null,
				rootMargin: '-20% 0px -60% 0px',
				threshold: [0.05, 0.25, 0.6]
			}
		);

		for (const card of filteredCards) {
			const node = cardElements.get(card.id);
			if (node) {
				observer.observe(node);
			}
		}

		if (filteredCards.length > 0 && (!focusedCardId || !filteredCards.some((card) => card.id === focusedCardId))) {
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

			if (!cancelled) {
				loading = false;
				await setupObserver();
			}
		})();

		return () => {
			cancelled = true;
			if (observer) {
				observer.disconnect();
			}
		};
	});

	$effect(() => {
		if (loading) {
			return;
		}

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
			<label class="space-y-2">
				<span class="text-sm font-semibold text-surface-700">Buscar en título, libro, autor y contenido</span>
				<input
					class="input"
					placeholder="Ej: pragmática, Putnam, p. 34"
					type="search"
					bind:value={query}
				/>
			</label>
			<div class="rounded-xl border border-surface-300/70 bg-surface-100/80 px-4 py-3">
				<p class="text-sm text-surface-700">Mostrando {filteredCards.length} de {data.totalCards} tarjetas.</p>
			</div>
		</div>

		<div class="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
			<aside class="rounded-2xl border border-surface-300/70 bg-surface-50/90 p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
				<p class="text-sm font-semibold tracking-[0.16em] text-surface-600 uppercase">Libros</p>
				<div class="mt-4 space-y-2">
					<button
						type="button"
						class={`w-full rounded-lg px-3 py-2 text-left text-sm ${
							selectedBook === 'all' ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'
						}`}
						onclick={() => {
							selectedBook = 'all';
						}}
					>
						<span class="font-semibold">Todos los libros</span>
						<span class="block text-xs">{data.totalCards} tarjetas</span>
					</button>
					{#each books as book}
						<button
							type="button"
							class={`w-full rounded-lg px-3 py-2 text-left text-sm ${
								selectedBook === book.key ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'
							}`}
							onclick={() => {
								selectedBook = book.key;
							}}
						>
							<span class="font-semibold">{book.author}</span>
							<span class="block text-xs">{book.title} ({book.count})</span>
						</button>
					{/each}
				</div>
			</aside>

			<div class="space-y-5">
				{#if loading}
					<p class="text-surface-700">Cargando tarjetas...</p>
				{:else}
					{#each filteredCards as card}
						<article
							id={`card-${card.id}`}
							data-card-id={card.id}
							use:trackCard={card.id}
							class={`scroll-mt-28 rounded-xl border bg-surface-100/80 p-5 transition-colors ${
								focusedCardId === card.id ? 'border-primary-300' : 'border-surface-300/70'
							}`}
						>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<p class="font-bold text-surface-900">
									{card.author} - {card.book}
								</p>
								<p class="text-xs tracking-[0.13em] text-surface-600 uppercase">p. {card.page ?? 's/p'}</p>
							</div>
							<p class="mt-4 whitespace-pre-wrap text-sm leading-7 text-surface-700">{card.content}</p>
							<div class="mt-4 flex items-center justify-between gap-2">
								<p class="text-xs text-surface-600">ID: {card.id}</p>
								<a class="btn variant-outline-surface" href={`/cards/${card.id}`}>Ver detalle</a>
							</div>
						</article>
					{/each}
					{#if filteredCards.length === 0}
						<p class="text-sm text-surface-700">No hay tarjetas que coincidan con la búsqueda o el filtro seleccionado.</p>
					{/if}
				{/if}
			</div>

			<aside class="rounded-2xl border border-surface-300/70 bg-surface-50/90 p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
				<p class="text-sm font-semibold tracking-[0.16em] text-surface-600 uppercase">Tabla de contenidos</p>
				<p class="mt-2 text-xs text-surface-600">La entrada visible en el centro se resalta aquí automáticamente.</p>
				<ul class="mt-4 space-y-2 pr-1">
					{#each filteredCards as card}
						<li>
							<button
								type="button"
								class={`w-full rounded-lg px-3 py-2 text-left text-sm ${
									focusedCardId === card.id ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'
								}`}
								onclick={() => {
									scrollToCard(card.id);
								}}
							>
								<span class="font-semibold">{card.author}</span>
								<span class="block text-xs">{card.book} · p. {card.page ?? 's/p'}</span>
							</button>
						</li>
					{/each}
					{#if filteredCards.length === 0}
						<li class="text-sm text-surface-600">Sin resultados para mostrar.</li>
					{/if}
				</ul>
			</aside>
		</div>
	</PageSection>
</div>
