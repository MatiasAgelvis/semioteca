<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Documentos | Significado Total</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection title="Documentos" description="Biblioteca de PDFs publicada como recursos estáticos." headingLevel="h1">
		<div class="grid gap-3">
			{#each data.resources as resource}
				<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-base-300/70 bg-base-200/70 px-4 py-3">
					<div class="min-w-0">
						<p class="wrap-break-word font-semibold text-base-content">{resource.title}</p>
						<p class="text-xs tracking-[0.14em] text-base-content/60 uppercase">Sección: {resource.section}</p>
					</div>
					<div class="flex shrink-0 justify-self-end gap-2">
						<a class="btn btn-outline btn-sm" href={resource.url} target="_blank" rel="noreferrer">Ver</a>
						<a class="btn btn-neutral btn-sm" href={resource.url} download>Descargar</a>
					</div>
				</div>
			{/each}
		</div>
	</PageSection>
</div>
