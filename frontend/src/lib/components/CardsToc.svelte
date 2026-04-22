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

<aside class="lg:sticky lg:top-24 lg:self-start">
	<div class="relative rounded-box border border-base-300 bg-base-100">
		<div class="border-b border-base-200 px-4 py-3">
			<p class="menu-title p-0">Tabla de contenidos</p>
		</div>
		<div class="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
			<ul class="menu menu-sm p-2">
				{#each cards as card}
					<li>
						<button
							type="button"
							class={focusedCardId === card.id ? 'menu-active' : ''}
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
		</div>
		<div class="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-base-100 to-transparent"></div>
	</div>
</aside>
