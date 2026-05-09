<script lang="ts">
	import HighlightedText from '$lib/components/HighlightedText.svelte';
	import SidebarContainer from './SidebarContainer.svelte';
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

<SidebarContainer title="Contenidos">
	<ul class="menu menu-sm p-0 w-auto">
		{#each cards as card}
			{@const authorSegments = getHighlightSegments(card.author, searchTerms)}
			{@const bookSegments = getHighlightSegments(card.book, searchTerms)}
			{@const pageSegments = getHighlightSegments(card.page ?? 's/p', searchTerms)}
			<li>
				<button
					type="button"
					class="flex items-stretch p-0 overflow-hidden {focusedCardId === card.id ? 'menu-active' : ''}"
					onclick={() => onscrollto(card.id)}
				>
					<span class="flex min-w-0 flex-1 flex-col px-3 py-2 text-left">
						<span class="block truncate font-semibold">
							<HighlightedText segments={authorSegments} />
						</span>
						<span class="block truncate text-xs opacity-70">
							<HighlightedText segments={bookSegments} />
						</span>
					</span>
					<span class="flex items-center justify-center border-l border-base-content/5 bg-base-content/5 px-2">
						<span class="font-mono text-[10px] font-bold tracking-tighter opacity-50">
							P. <HighlightedText segments={pageSegments} />
						</span>
					</span>
				</button>
			</li>
		{/each}
		{#if cards.length === 0}
			<li class="text-xs opacity-60 px-4 py-2">Sin resultados para mostrar.</li>
		{/if}
	</ul>
</SidebarContainer>

