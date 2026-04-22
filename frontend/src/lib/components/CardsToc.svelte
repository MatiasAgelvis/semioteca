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

<aside class="rounded-2xl border border-surface-300/70 bg-surface-50/90 p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
	<p class="text-sm font-semibold tracking-[0.16em] text-surface-600 uppercase">Tabla de contenidos</p>
	<p class="mt-2 text-xs text-surface-600">La entrada visible en el centro se resalta aquí automáticamente.</p>
	<ul class="mt-4 space-y-2 pr-1">
		{#each cards as card}
			<li>
				<button
					type="button"
					class={`w-full rounded-lg px-3 py-2 text-left text-sm ${focusedCardId === card.id ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'}`}
					onclick={() => onscrollto(card.id)}
				>
					<span class="font-semibold">{card.author}</span>
					<span class="block text-xs">{card.book} · p. {card.page ?? 's/p'}</span>
				</button>
			</li>
		{/each}
		{#if cards.length === 0}
			<li class="text-sm text-surface-600">Sin resultados para mostrar.</li>
		{/if}
	</ul>
</aside>
