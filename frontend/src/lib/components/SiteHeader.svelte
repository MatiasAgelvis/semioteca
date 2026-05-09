<script lang="ts">
    import { cubicOut } from 'svelte/easing';
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import ThemeSwitcher from './ThemeSwitcher.svelte';
    import { cardsSearchDialogOpen, cardsSearchQuery, openCardsSearch } from '$lib/stores/cardsSearch';
    import { SHOW_CV, SHOW_DOCS } from '$lib/config/features';
    import { goto } from '$app/navigation';

    const links = [
        { href: '/', label: 'Inicio' },
        { href: '/cards', label: 'Tarjetas' },
        { href: '/blog', label: 'Blog' },
        { href: '/contact', label: 'Contacto' },
        ...(SHOW_DOCS ? [{ href: '/docs', label: 'Documentos' }] : []),
        ...(SHOW_CV ? [{ href: '/cv', label: 'CV' }] : [])
    ];

    let suppressFocus = false;
    let searchButtonEl = $state<HTMLButtonElement | null>(null);

    $effect(() => {
        return cardsSearchDialogOpen.subscribe((open) => {
            if (!open) {
                suppressFocus = true;
                setTimeout(() => { suppressFocus = false; }, 300);
                // Ensure focus returns to the button and blur it to avoid "ghost" focus state
                searchButtonEl?.focus();
                searchButtonEl?.blur();
            }
        });
    });

    let compactHeader = $state(false);
    let menuOpen = $state(false);
    const isCardsRoute = $derived(page.url.pathname.startsWith('/cards'));
    const isCardsIndex = $derived(page.url.pathname === '/cards' || page.url.pathname === '/cards/');

    async function handleSearchAction() {
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
        <div class={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 transition-[padding,grid-template-columns,gap] duration-300 ease-out ${compactHeader ? 'py-2' : 'py-3'}`}>
            <a href="/" class={`flex min-w-0 items-center gap-2 text-base-content transition-[font-size,transform] duration-300 ease-out ${compactHeader ? 'text-base lg:text-xl' : 'text-lg sm:text-xl' } font-black tracking-tight`}>
                <span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-base-300/80 bg-base-300/60" aria-hidden="true">
                    <span
                        class="h-4 w-4 bg-base-content"
                        style="mask: url('/favicon.svg') center / contain no-repeat; -webkit-mask: url('/favicon.svg') center / contain no-repeat;"
                    ></span>
                </span>
                <span class="hidden truncate sm:inline">Significado Total</span>
            </a>

            {#if isCardsRoute}
                <div class={`relative flex min-w-0 items-center transition-[transform,opacity] duration-300 ease-out ${compactHeader ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'}`}>
                    <button
                        bind:this={searchButtonEl}
                        type="button"
                        class={`input input-bordered flex w-full items-center justify-between rounded-full bg-base-100/90 gap-2 px-3 sm:px-4 text-left transition-[height,box-shadow] duration-300 ease-out hover:border-primary/50 focus:border-primary focus:outline-hidden ${compactHeader ? 'h-9 min-h-9 sm:h-10 sm:min-h-10 shadow-sm' : 'h-10 min-h-10 sm:h-11 sm:min-h-11'}`}
                        onclick={handleSearchAction}
                    >
                        <span class="truncate text-sm opacity-50">
                            {$cardsSearchQuery || (compactHeader ? 'Buscar...' : 'Buscar en todas las tarjetas')}
                        </span>
                        <span class="hidden text-xs opacity-50 sm:inline">⌘K</span>
                    </button>
                </div>
            {/if}

            <div class="flex items-center justify-end gap-2">
                <div class={`hidden overflow-hidden transition-[max-width,opacity,transform,margin] duration-300 ease-out xl:block ${compactHeader ? 'pointer-events-none max-w-0 -translate-y-1 opacity-0' : 'max-w-xl translate-y-0 opacity-100'}`}>
                    <nav class="flex items-center gap-2 whitespace-nowrap" aria-label="Primary">
                        {#each links as link}
                            <a
                                href={link.href}
                                class={`btn btn-ghost relative ${isActive(link.href) ? 'text-primary' : 'text-base-content/70 hover:text-base-content'}`}
                            >
                                {link.label}
                                {#if isActive(link.href)}
                                    <div 
                                        class="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-primary"
                                        transition:fade={{ duration: 150 }}
                                    ></div>
                                {/if}
                            </a>
                        {/each}
                    </nav>
                </div>
                
                <button
                    type="button"
                    class={`btn btn-ghost transition-[opacity,transform] duration-300 ease-out ${compactHeader ? 'inline-flex translate-y-0 opacity-100' : 'inline-flex xl:hidden'}`}
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
