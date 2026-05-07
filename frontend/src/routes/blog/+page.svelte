<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';
	import BlogPostCard from '$lib/components/BlogPostCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Blog | Significado Total</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection
		title="Blog"
		description="Ensayos y notas críticas generadas desde el repositorio de manuscritos."
		headingLevel="h1"
	>
		<div class="grid gap-5 md:grid-cols-2">
			{#each data.posts as post}
				<BlogPostCard {post} variant="list" />
			{/each}
		</div>
	</PageSection>
</div>
