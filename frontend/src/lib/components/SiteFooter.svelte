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

<footer class="footer sm:footer-horizontal bg-base-200 text-base-content p-10">
    <aside class="flex items-center gap-4">
        <Logo size={10} />
        <div class="flex flex-col justify-start gap-1">
                <div class="flex flex-row items-center gap-1">
                    <p class="font-bold text-sm">Significado Total</p>
                    <p class="text-xs opacity-60">© {currentYear}</p>
                </div>
                <p class="text-xs opacity-60">Por Valmore Agelvis y <a class="link link-primary no-underline hover:underline" href="https://matiasagelvis.com" target="_blank" rel="noopener">Matías Agelvis</a></p>
            </div>
        </aside>

        <nav>
        <div class="grid grid-flow-col gap-6">
            {#each navLinks as link}
                <a href={link.href} class="link link-hover text-xs font-semibold uppercase tracking-wider opacity-70 hover:opacity-100">{link.label}</a>
            {/each}
            <!-- <a href="https://github.com/matiasagelvis/semioteca" target="_blank" rel="noopener" class="link link-hover text-xs font-semibold uppercase tracking-wider opacity-70 hover:opacity-100">GitHub</a> -->
        </div>
        </nav>
</footer>
