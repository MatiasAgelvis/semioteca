<script lang="ts">
	import { SHOW_CV, SHOW_DOCS } from '$lib/config/features';
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
		<div class="mt-8 flex flex-wrap gap-3">
			<a class="btn btn-primary" href="/cards">Explorar tarjetas</a>
			<a class="btn btn-outline" href="/blog">Ir al blog</a>
			{#if SHOW_DOCS}
				<a class="btn btn-outline" href="/docs">Ver documentos</a>
			{/if}
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
			<p class="mt-3 text-sm leading-7 text-base-content/70">Listado de manuscritos con vista de artículo renderizada en HTML.</p>
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
</div>
