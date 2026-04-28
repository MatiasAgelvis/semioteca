<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.post.title} | Significado Total</title>
</svelte:head>

<div class="mx-auto w-full max-w-4xl px-5 py-10 lg:px-10">
	<div class="mb-5">
		<a href="/blog" class="btn btn-ghost btn-sm gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
			Volver al blog
		</a>
	</div>
	<article class="rounded-2xl border border-base-300/70 bg-base-100/90 p-6 shadow-lg shadow-base-content/5 lg:p-10">
		<p class="mb-4 text-sm font-semibold tracking-[0.2em] text-base-content/60 uppercase">Blog Significado Total</p>
		<h1 class="text-3xl font-black tracking-tight text-base-content lg:text-4xl">{data.post.title}</h1>
		<div class="prose prose-slate mt-8 max-w-none prose-headings:font-black prose-a:text-primary prose-img:rounded-xl">
			{@html data.post.html}
		</div>
	</article>
</div>
