<script lang="ts">
	import type { CardRecord } from '$lib/types/content';

	let {
		cards,
		focusedCardId,
		onscrollto
	}: {
		cards: CardRecord[];
		focusedCardId: string | null;
		onscrollto: (id: string) => void;
	} = $props();
</script>

<aside class="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
	<ul class="menu menu-sm bg-base-100 border border-base-300 rounded-box">
		<li class="menu-title">Tabla de contenidos</li>
		{#each cards as card}
			<li>
				<button
					type="button"
					class={focusedCardId === card.id ? 'active' : ''}
					onclick={() => onscrollto(card.id)}
				>
					<span>
						<span class="block font-semibold">{card.author}</span>
						<span class="block text-xs opacity-60">{card.book} · p. {card.page ?? 's/p'}</span>
					</span>
				</button>
			</li>
		{/each}
		{#if cards.length === 0}
			<li class="text-xs opacity-60 px-4 py-2">Sin resultados para mostrar.</li>
		{/if}
	</ul>
</aside>
