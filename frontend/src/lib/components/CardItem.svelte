<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { CardRecord } from '$lib/types/content';

	let {
		card,
		focused,
		onregister,
		onunregister
	}: {
		card: CardRecord;
		focused: boolean;
		onregister?: (el: HTMLElement, id: string) => void;
		onunregister?: (el: HTMLElement, id: string) => void;
	} = $props();

	let element: HTMLElement;

	onMount(() => {
		onregister?.(element, card.id);
	});

	onDestroy(() => {
		onunregister?.(element, card.id);
	});
</script>

<article
	bind:this={element}
	id={`card-${card.id}`}
	data-card-id={card.id}
	class={`scroll-mt-28 rounded-xl border bg-surface-100/80 p-5 transition-colors ${focused ? 'border-primary-300' : 'border-surface-300/70'}`}
>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="font-bold text-surface-900">{card.author} - {card.book}</p>
		<p class="text-xs tracking-[0.13em] text-surface-600 uppercase">p. {card.page ?? 's/p'}</p>
	</div>
	<p class="mt-4 whitespace-pre-wrap text-sm leading-7 text-surface-700">{card.content}</p>
	<div class="mt-4 flex items-center justify-between gap-2">
		<p class="text-xs text-surface-600">ID: {card.id}</p>
		<a class="btn btn-sm btn-outline" href={`/cards/${card.id}`}>Ver detalle</a>
	</div>
</article>
