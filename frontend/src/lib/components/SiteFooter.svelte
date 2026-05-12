<script lang="ts">
    import { SHOW_CV, SHOW_DOCS } from '$lib/config/features';
    import Logo from '$lib/components/Logo.svelte';

    const navLinks = [
        { label: 'Inicio', href: '/' },
        { label: 'Tarjetas', href: '/cards' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contacto', href: '/contact' },
        ...(SHOW_DOCS ? [{ label: 'Documentos', href: '/docs' }] : []),
        ...(SHOW_CV ? [{ label: 'CV', href: '/cv' }] : []),
    ];

    const currentYear = new Date().getFullYear();
</script>

<footer class="footer footer-horizontal md:footer-vertical footer-center gap-12 bg-base-200 p-10 text-base-content">
	<aside class="flex items-center gap-4 text-center sm:text-left order-2 md:order-1">
		<Logo size={10} />
		<div class="flex flex-col justify-start items-start gap-1">
			<div class="flex flex-row items-center justify-center gap-1 sm:justify-start">
				<p class="text-sm font-bold">Significado Total</p>
				<p class="text-xs opacity-60">© {currentYear}</p>
			</div>
			<p class="text-xs opacity-60">
				Por Valmore Agelvis y <a
					class="link link-primary no-underline hover:underline"
					href="https://matiasagelvis.com"
					target="_blank"
					rel="noopener">Matías Agelvis</a
				>
			</p>
		</div>
	</aside>

	<nav class="order-1 md:order-2">
		<div class="flex flex-wrap justify-center gap-6 sm:grid sm:grid-flow-col">
			{#each navLinks as link}
				<a
					href={link.href}
					class="link link-hover text-xs font-semibold uppercase tracking-wider opacity-70 hover:opacity-100"
					>{link.label}</a
				>
			{/each}
		</div>
	</nav>
</footer>
