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
	class={`card bg-base-100 border scroll-mt-28 transition-colors ${focused ? 'border-primary shadow-sm' : 'border-base-300'}`}
>
	<div class="card-body p-5">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<p class="font-bold">{card.author} — {card.book}</p>
			<span class="badge badge-ghost badge-sm">p. {card.page ?? 's/p'}</span>
		</div>
		<p class="whitespace-pre-wrap text-sm leading-7 opacity-80">{card.content}</p>
		<div class="card-actions items-center justify-between">
			<span class="text-xs opacity-50">ID: {card.id}</span>
			<a class="btn btn-sm btn-outline" href={`/cards/${card.id}`}>Ver detalle</a>
		</div>
	</div>
</article>
