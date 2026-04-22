<script lang="ts">
    import { page } from "$app/state";
    import ThemeSwitcher from "./ThemeSwitcher.svelte";

    const links = [
        { href: "/", label: "Inicio" },
        { href: "/cards", label: "Tarjetas" },
        { href: "/blog", label: "Blog" },
        { href: "/docs", label: "Documentos" },
        { href: "/cv", label: "CV" },
    ];

    function isActive(href: string): boolean {
        const pathname = page.url.pathname;
        return href === "/" ? pathname === "/" : pathname.startsWith(href);
    }
</script>

<header class="border-b border-base-200 bg-base-100 backdrop-blur-sm dark:bg-base-900 dark:border-base-200/40">
    <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-10">
        <a href="/" class="text-xl font-black tracking-tight text-base-content">
            Semioteca
        </a>

        <div class="flex flex-wrap items-center gap-2">
            <nav class="flex flex-wrap items-center gap-2" aria-label="Primary">
                {#each links as link}
                    <a
                        href={link.href}
                        class={`btn btn-ghost btn-sm ${isActive(link.href) ? 'btn-active' : ''}`}
                    >
                        {link.label}
                    </a>
                {/each}
            </nav>

            <ThemeSwitcher />
        </div>
    </div>
</header>
