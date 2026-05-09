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
	<ul class="menu menu-sm p-0">
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
					<span class="grow text-left">
						<span class="block font-semibold line-clamp-1"><HighlightedText segments={authorSegments} /></span>
						<span class="block text-xs opacity-60 line-clamp-1">
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
</SidebarContainer>

