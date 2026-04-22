<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.card.author} - {data.card.book} | Semioteca</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 lg:px-10">
	<article class="rounded-[1.75rem] border border-surface-300/70 bg-surface-50/85 p-6 shadow-lg shadow-surface-950/5 lg:p-10">
		<a class="btn variant-outline-surface mb-5" href="/cards">Volver al repositorio</a>
		<h1 class="text-3xl font-black text-surface-950 lg:text-4xl">{data.card.book}</h1>
		<p class="mt-2 text-surface-700">{data.card.author} ({data.card.year}) - página {data.card.page ?? 's/p'}</p>
		<div class="mt-7 rounded-xl bg-surface-100/80 p-5">
			<p class="whitespace-pre-wrap leading-8 text-surface-800">{data.card.content}</p>
		</div>
		<p class="mt-5 text-sm text-surface-600">Fuente: {data.card.source_path}</p>
	</article>
</div>
