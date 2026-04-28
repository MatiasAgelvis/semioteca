<script lang="ts">
	import { SHOW_CV, SHOW_DOCS } from '$lib/config/features';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Significado Total</title>
	<meta name="description" content="Fichero de ciencias del significado: tarjetas, ensayos y documentos sobre semiótica, lingüística y filosofía del lenguaje." />
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-5 py-10 lg:px-10">
	<section class="rounded-2xl border border-base-300/70 bg-base-100/90 p-8 shadow-xl shadow-base-content/5 lg:p-12">
		<!-- <p class="text-primary text-sm font-semibold tracking-[0.25em] uppercase">Significado Total</p> -->
		<h1 class="mt-3 max-w-4xl text-5xl font-black tracking-tight text-base-content sm:text-6xl">
			Ciencias del significado
		</h1>
		<p class="mt-6 max-w-3xl text-lg leading-8 text-base-content/70">
			Un fichero estático para explorar tarjetas de lectura, ensayos y documentos sobre semiótica,
			lingüística y filosofía del lenguaje.
		</p>
		<div class="mt-10 flex gap-8">
			<div>
				<p class="text-3xl font-black tracking-tight text-base-content">{data.totalCards}</p>
				<p class="mt-1 text-xs font-semibold tracking-[0.2em] text-base-content/50 uppercase">Tarjetas</p>
			</div>
			<div class="w-px bg-base-300"></div>
			<div>
				<p class="text-3xl font-black tracking-tight text-base-content">{data.totalBooks}</p>
				<p class="mt-1 text-xs font-semibold tracking-[0.2em] text-base-content/50 uppercase">Obras</p>
			</div>
		</div>
	</section>

	<section class={`mt-8 grid gap-4 md:grid-cols-2 ${SHOW_DOCS || SHOW_CV ? 'xl:grid-cols-4' : 'xl:grid-cols-2'}`}>
		<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/cards">
			<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Repositorio</p>
			<h2 class="mt-2 text-xl font-black text-base-content">Tarjetas</h2>
			<p class="mt-3 text-sm leading-7 text-base-content/70">Búsqueda, filtros por obra y detalle por ficha bibliográfica.</p>
		</a>
		<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/blog">
			<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Publicaciones</p>
			<h2 class="mt-2 text-xl font-black text-base-content">Blog</h2>
			<p class="mt-3 text-sm leading-7 text-base-content/70">Análisis de cine y series desde las ciencias del significado.</p>
		</a>
		{#if SHOW_DOCS}
			<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/docs">
				<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Archivo</p>
				<h2 class="mt-2 text-xl font-black text-base-content">Documentos</h2>
				<p class="mt-3 text-sm leading-7 text-base-content/70">Acceso web y descarga directa de recursos PDF publicados.</p>
			</a>
		{/if}
		{#if SHOW_CV}
			<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/cv">
				<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Trayectoria</p>
				<h2 class="mt-2 text-xl font-black text-base-content">CV</h2>
				<p class="mt-3 text-sm leading-7 text-base-content/70">Resumen académico y enlaces a secciones curriculares.</p>
			</a>
		{/if}
	</section>

	{#if data.recentPosts.length > 0}
		<section class="mt-8">
			<h2 class="mb-4 text-xs font-semibold tracking-[0.2em] text-base-content/50 uppercase">Últimas entradas</h2>
			<div class="grid gap-4 md:grid-cols-3">
				{#each data.recentPosts as post}
					<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/blog/{post.slug}">
						{#if post.coverImage}
							<img src={post.coverImage} alt={post.title} class="mb-4 h-36 w-full rounded-xl object-cover" />
						{/if}
						<h3 class="text-base font-black text-base-content">{post.title}</h3>
						{#if post.excerpt}
							<p class="mt-2 text-sm leading-6 text-base-content/60 line-clamp-3">{post.excerpt}</p>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
