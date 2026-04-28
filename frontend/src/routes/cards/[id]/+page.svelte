<script lang="ts">
	import type { CardImage } from '$lib/types/content';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImage };

	const contentParts = $derived.by<ContentPart[]>(() => {
		const imageMap = new Map(data.card.images.map((img) => [img.placeholder_id, img]));
		const chunks = data.card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
		const parts: ContentPart[] = [];
		for (let i = 0; i < chunks.length; i++) {
			if (i % 2 === 0) {
				if (chunks[i].trim()) parts.push({ kind: 'text', text: chunks[i] });
			} else {
				const img = imageMap.get(Number(chunks[i]));
				if (img) parts.push({ kind: 'image', image: img });
			}
		}
		return parts;
	});

	function imageUrl(image: CardImage): string {
		const idx = image.path.indexOf('cards_images/');
		return idx !== -1 ? `/content/${image.path.slice(idx)}` : '';
	}
</script>

<svelte:head>
	<title>{data.card.author} - {data.card.book} | Semioteca</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 lg:px-10">
	<article class="card bg-base-100 border border-base-300 p-6 shadow-sm lg:p-10">
		<a class="btn btn-outline mb-5 w-fit" href="/cards">← Volver al repositorio</a>
		<h1 class="text-3xl font-black lg:text-4xl">{data.card.book}</h1>
		<p class="mt-2 opacity-70">{data.card.author} ({data.card.year}) — página {data.card.page ?? 's/p'}</p>
		<div class="mt-7 space-y-4 rounded-xl border border-base-200 bg-base-200/40 p-5">
			{#each contentParts as part}
				{#if part.kind === 'text'}
					<p class="whitespace-pre-wrap leading-8 opacity-90">{part.text}</p>
				{:else}
					<figure class="my-2">
						<img
							src={imageUrl(part.image)}
							alt={part.image.alt_text ?? part.image.caption ?? ''}
							loading="lazy"
							class="max-w-full rounded-lg border border-base-200"
						/>
						{#if part.image.caption}
							<figcaption class="mt-1 text-xs opacity-50">{part.image.caption}</figcaption>
						{/if}
					</figure>
				{/if}
			{/each}
		</div>
		<p class="mt-5 text-xs opacity-40">Fuente: {data.card.source_path}</p>
	</article>
</div>
