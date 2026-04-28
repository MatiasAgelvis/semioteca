<svelte:head>
	<title>Semioteca</title>
	<meta name="description" content="Archivo semiótico estático con fichas, blog, CV y documentos." />
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-5 py-10 lg:px-10">
	<section class="rounded-[2rem] border border-base-300/70 bg-base-100/90 p-8 shadow-xl shadow-base-content/5 lg:p-12">
		<p class="text-primary text-sm font-semibold tracking-[0.25em] uppercase">Semioteca</p>
		<h1 class="mt-3 max-w-4xl text-5xl font-black tracking-tight text-base-content sm:text-6xl">
			Semiótica aplicada, biblioteca viva y archivo documental.
		</h1>
		<p class="mt-6 max-w-3xl text-lg leading-8 text-base-content/70">
			Una plataforma estática para consultar tarjetas de lectura, ensayos, CV y documentos en PDF con un
			flujo reproducible desde backend hacia frontend.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<a class="btn btn-primary" href="/cards">Explorar tarjetas</a>
			<a class="btn btn-outline" href="/blog">Ir al blog</a>
			<a class="btn btn-outline" href="/docs">Ver documentos</a>
		</div>
	</section>

	<section class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
		<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/docs">
			<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Archivo</p>
			<h2 class="mt-2 text-xl font-black text-base-content">Documentos</h2>
			<p class="mt-3 text-sm leading-7 text-base-content/70">Acceso web y descarga directa de recursos PDF publicados.</p>
		</a>
		<a class="group rounded-2xl border border-base-300/70 bg-base-100/80 p-5 transition hover:border-primary/30" href="/cv">
			<p class="text-primary text-xs font-semibold tracking-[0.2em] uppercase">Trayectoria</p>
			<h2 class="mt-2 text-xl font-black text-base-content">CV</h2>
			<p class="mt-3 text-sm leading-7 text-base-content/70">Resumen académico y enlaces a secciones curriculares.</p>
		</a>
	</section>
</div>
