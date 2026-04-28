<script lang="ts">
    import { cubicOut } from 'svelte/easing';
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import ThemeSwitcher from './ThemeSwitcher.svelte';
    import { cardsSearchDialogOpen, cardsSearchQuery, openCardsSearch } from '$lib/stores/cardsSearch';
    import { goto } from '$app/navigation';

    const links = [
        { href: '/', label: 'Inicio' },
        { href: '/cards', label: 'Tarjetas' },
        { href: '/blog', label: 'Blog' },
        { href: '/docs', label: 'Documentos' },
        { href: '/cv', label: 'CV' }
    ];

    let suppressFocus = false;

    $effect(() => {
        return cardsSearchDialogOpen.subscribe((open) => {
            if (!open) {
                suppressFocus = true;
                setTimeout(() => { suppressFocus = false; }, 300);
            }
        });
    });

    let compactHeader = $state(false);
    let menuOpen = $state(false);
    const isCardsRoute = $derived(page.url.pathname.startsWith('/cards'));
    const isCardsIndex = $derived(page.url.pathname === '/cards' || page.url.pathname === '/cards/');

    async function handleSearchFocus() {
        if (suppressFocus) return;
        if (isCardsIndex) {
            openCardsSearch();
        } else {
            await goto('/cards');
            openCardsSearch();
        }
    }

    async function handleSearchInput() {
        if (isCardsIndex) {
            openCardsSearch();
        } else {
            await goto('/cards');
            openCardsSearch();
        }
    }

    function isActive(href: string): boolean {
        const pathname = page.url.pathname;
        return href === '/' ? pathname === '/' : pathname.startsWith(href);
    }

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    function closeMenu() {
        menuOpen = false;
    }

    let headerEl = $state<HTMLElement | null>(null);

    onMount(() => {
        const updateCompactHeader = () => {
            compactHeader = window.scrollY > 24;
            if (!compactHeader) menuOpen = false;
        };

        updateCompactHeader();
        window.addEventListener('scroll', updateCompactHeader, { passive: true });

        const ro = new ResizeObserver((entries) => {
            const h = entries[0]?.borderBoxSize?.[0]?.blockSize ?? (headerEl?.offsetHeight ?? 0);
            document.documentElement.style.setProperty('--header-height', `${h}px`);
        });
        if (headerEl) ro.observe(headerEl);

        return () => {
            window.removeEventListener('scroll', updateCompactHeader);
            ro.disconnect();
        };
    });

    $effect(() => {
        page.url.pathname;
        menuOpen = false;
    });
</script>

<header bind:this={headerEl} class="sticky top-0 z-50 border-b border-base-200/80 bg-base-100/90 backdrop-blur-md dark:border-base-200/40 dark:bg-base-900/85">
    <div class="mx-auto w-full max-w-7xl px-5 lg:px-10">
        <div class={`grid items-center gap-3 transition-[padding,grid-template-columns,gap] duration-300 ease-out ${compactHeader ? 'grid-cols-[auto_minmax(0,1fr)_auto] py-2' : 'grid-cols-[auto_minmax(0,1fr)_auto] py-3'}`}>
            <a href="/" class={`text-base-content transition-[font-size,transform] duration-300 ease-out ${compactHeader ? 'text-lg lg:text-xl' : 'text-xl' } font-black tracking-tight`}>
                Semioteca
            </a>

            {#if isCardsRoute}
                <label class={`relative min-w-0 transition-[transform,opacity] duration-300 ease-out ${compactHeader ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'}`}>
                    <input
                        bind:value={$cardsSearchQuery}
                        class={`input input-bordered w-full rounded-full bg-base-100/90 pr-24 transition-[height,box-shadow] duration-300 ease-out ${compactHeader ? 'h-10 shadow-sm' : 'h-11'}`}
                        placeholder="Buscar en todas las tarjetas"
                        type="search"
                        onfocus={handleSearchFocus}
                        oninput={handleSearchInput}
                    />
                    <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs opacity-50">⌘K</span>
                </label>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <div class={`hidden overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-out xl:block ${compactHeader ? 'pointer-events-none max-w-0 -translate-y-1 opacity-0' : 'max-w-xl translate-y-0 opacity-100'}`}>
                    <nav class="flex items-center gap-2 whitespace-nowrap" aria-label="Primary">
                        {#each links as link}
                            <a
                                href={link.href}
                                class={`btn btn-ghost btn-sm ${isActive(link.href) ? 'btn-active' : ''}`}
                            >
                                {link.label}
                            </a>
                        {/each}
                    </nav>
                </div>
                
                <button
                    type="button"
                    class={`btn btn-ghost btn-sm transition-[opacity,transform] duration-300 ease-out ${compactHeader ? 'inline-flex translate-y-0 opacity-100' : 'inline-flex xl:hidden'}`}
                    onclick={toggleMenu}
                    aria-expanded={menuOpen}
                    aria-label="Abrir menu"
                >
                    Menu
                </button>
                <div class="flex shrink-0 items-center justify-end">
                    <ThemeSwitcher />
                </div>
            </div>
        </div>
        
        {#if menuOpen}
            <div
                class="absolute inset-x-0 top-full z-50 border-b border-base-200/80 bg-base-100/95 shadow-lg backdrop-blur-md dark:bg-base-900/92"
                transition:fly={{ y: -10, duration: 220, easing: cubicOut }}
            >
                <div class="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-4 lg:px-10">
                    <nav class="flex flex-col gap-2" aria-label="Primary mobile">
                        {#each links as link}
                            <a
                                href={link.href}
                                class={`btn justify-start ${isActive(link.href) ? 'btn-primary' : 'btn-ghost'}`}
                                onclick={closeMenu}
                            >
                                {link.label}
                            </a>
                        {/each}
                    </nav>
                </div>
            </div>
        {/if}
    </div>

    {#if menuOpen}
        <button
            type="button"
            class="fixed inset-0 z-40 bg-transparent"
            onclick={closeMenu}
            aria-label="Cerrar menu"
            transition:fade={{ duration: 150 }}
        ></button>
    {/if}
</header>
