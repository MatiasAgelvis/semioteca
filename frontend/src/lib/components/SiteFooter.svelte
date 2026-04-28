<script lang="ts">
    import { SHOW_CV, SHOW_DOCS } from '$lib/config/features';

    const navLinks = [
        { label: 'Inicio', href: '/' },
        { label: 'Tarjetas', href: '/cards' },
        { label: 'Blog', href: '/blog' },
        ...(SHOW_DOCS ? [{ label: 'Documentos', href: '/docs' }] : []),
        ...(SHOW_CV ? [{ label: 'CV', href: '/cv' }] : []),
    ];

    const currentYear = new Date().getFullYear();
</script>

<footer class="footer footer-horizontal footer-center bg-base-200 text-base-content rounded p-8 md:p-10">
    <aside>
        <p class="text-xl font-black tracking-tight">Semioteca</p>
        <p class="max-w-2xl text-sm opacity-80">Archivo de tarjetas, blog y documentos sobre semiotica, lenguaje y memoria.</p>
    </aside>

    <nav class="grid grid-flow-col gap-4" aria-label="Enlaces del pie de pagina">
        {#each navLinks as link}
            <a href={link.href} class="link link-hover">{link.label}</a>
        {/each}
    </nav>

    <p class="text-xs opacity-70">© {currentYear} Semioteca</p>
</footer>
