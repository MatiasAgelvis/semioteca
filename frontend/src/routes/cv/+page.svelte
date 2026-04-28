<script lang="ts">
	import PageSection from '$lib/components/PageSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>CV | Semioteca</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 lg:px-10">
	<PageSection
		title="Curriculum y producción académica"
		description="Resumen profesional y acceso directo a los documentos curriculares en PDF."
		headingLevel="h1"
	>
		<div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<article class="rounded-2xl border border-base-300/70 bg-base-200/70 p-5">
				<h3 class="text-xl font-black text-base-content">Perfil</h3>
				<p class="mt-3 leading-8 text-base-content/70">
					Investigación y docencia en semiótica, pragmática y teoría de la interpretación. Este espacio agrupa
					trayectoria académica, publicaciones y producción documental asociada.
				</p>
				<p class="mt-4 leading-8 text-base-content/70">
					Los recursos se publican desde el backend como archivos estáticos, manteniendo un flujo de trabajo
					reproducible para despliegue sin servidor.
				</p>
			</article>

			<article class="rounded-2xl border border-base-300/70 bg-base-100/90 p-5">
				<h3 class="text-xl font-black text-base-content">Descargas principales</h3>
				<ul class="mt-4 space-y-3">
					{#each data.resources as resource}
						<li class="flex items-center justify-between gap-3 rounded-xl bg-base-200/80 px-3 py-2">
							<span class="text-sm text-base-content">{resource.title}</span>
							<a class="btn btn-outline btn-sm" href={resource.url} target="_blank" rel="noreferrer">Abrir</a>
						</li>
					{/each}
				</ul>
			</article>
		</div>
	</PageSection>
</div>
