<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.post.title} | Semioteca</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl px-5 py-10 lg:px-10">
	<article class="rounded-[1.75rem] border border-surface-300/70 bg-surface-50/85 p-6 shadow-lg shadow-surface-950/5 lg:p-10">
		<p class="mb-4 text-sm font-semibold tracking-[0.2em] text-surface-600 uppercase">Blog Semioteca</p>
		<h1 class="text-3xl font-black tracking-tight text-surface-950 lg:text-4xl">{data.post.title}</h1>
		<div class="prose prose-slate mt-8 max-w-none prose-headings:font-black prose-a:text-primary-700 prose-img:rounded-xl">
			{@html data.post.html}
		</div>
	</article>
</div>
