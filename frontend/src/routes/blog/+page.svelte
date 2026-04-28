<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Blog | Semioteca</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection
		title="Blog"
		description="Ensayos y notas críticas generadas desde el repositorio de manuscritos."
	>
		<div class="grid gap-5 md:grid-cols-2">
			{#each data.posts as post}
				<article class="rounded-2xl border border-base-300/70 bg-base-100/90 p-5 shadow-md shadow-base-content/5">
					{#if post.coverImage}
						<img src={post.coverImage} alt={post.title} class="mb-4 h-44 w-full rounded-xl object-cover" />
					{/if}
					<h2 class="text-xl font-black text-base-content">
						<a class="hover:text-primary" href={`/blog/${post.slug}`}>{post.title}</a>
					</h2>
					<p class="mt-3 text-sm leading-7 text-base-content/70">{post.excerpt}</p>
					<a class="btn btn-outline mt-5" href={`/blog/${post.slug}`}>Leer artículo</a>
				</article>
			{/each}
		</div>
	</PageSection>
</div>
