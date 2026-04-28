<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import type { CardRecord } from '$lib/types/content';
	import { getHighlightSegments } from '$lib/utils/search';

	let {
		cards,
		focusedCardId,
		searchTerms = [],
		onscrollto
	}: {
		cards: CardRecord[];
		focusedCardId: string | null;
		searchTerms?: string[];
		onscrollto: (id: string) => void;
	} = $props();
</script>

<aside class="lg:sticky lg:top-28 lg:self-start xl:top-24">
	<div class="relative rounded-box border border-base-300 bg-base-100">
		<div class="border-b border-base-200 px-4 py-3">
			<p class="menu-title p-0">Tabla de contenidos</p>
		</div>
		<div class="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-15rem)] xl:max-h-[calc(100vh-14rem)]">
			<ul class="menu menu-sm p-2">
				{#each cards as card}
					{@const authorSegments = getHighlightSegments(card.author, searchTerms)}
					{@const bookSegments = getHighlightSegments(card.book, searchTerms)}
					{@const pageSegments = getHighlightSegments(card.page ?? 's/p', searchTerms)}
					<li>
						<button
							type="button"
							class={focusedCardId === card.id ? 'menu-active' : ''}
							onclick={() => onscrollto(card.id)}
						>
							<span>
								<span class="block font-semibold"><HighlightedText segments={authorSegments} /></span>
								<span class="block text-xs opacity-60">
									<HighlightedText segments={bookSegments} /> · p. <HighlightedText segments={pageSegments} />
								</span>
							</span>
						</button>
					</li>
				{/each}
				{#if cards.length === 0}
					<li class="text-xs opacity-60 px-4 py-2">Sin resultados para mostrar.</li>
				{/if}
			</ul>
		</div>
		<div class="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-linear-to-t from-base-100 to-transparent"></div>
	</div>
</aside>
