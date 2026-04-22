<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Documentos | Semioteca</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection title="Documentos" description="Biblioteca de PDFs publicada como recursos estáticos.">
		<div class="grid gap-3">
			{#each data.resources as resource}
				<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-300/70 bg-surface-100/70 px-4 py-3">
					<div>
						<p class="font-semibold text-surface-900">{resource.title}</p>
						<p class="text-xs tracking-[0.14em] text-surface-600 uppercase">Sección: {resource.section}</p>
					</div>
					<div class="flex gap-2">
						<a class="btn variant-outline-surface" href={resource.url} target="_blank" rel="noreferrer">Ver</a>
						<a class="btn variant-filled-surface" href={resource.url} download>Descargar</a>
					</div>
				</div>
			{/each}
		</div>
	</PageSection>
</div>
