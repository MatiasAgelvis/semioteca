<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    let theme = $state("light");

    function setTheme(value: string) {
        theme = value;
        if (browser) {
            document.documentElement.dataset.theme = theme;
            localStorage.setItem("theme", theme);
        }
    }

    function toggleTheme() {
        setTheme(theme === "dark" ? "light" : "dark");
    }

    onMount(() => {
        if (!browser) return;

        const stored = localStorage.getItem("theme");
        if (stored === "dark" || stored === "light") {
            theme = stored;
            document.documentElement.dataset.theme = theme;
            return;
        }

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        theme = prefersDark ? "dark" : "light";
        document.documentElement.dataset.theme = theme;
    });
</script>

<button
    type="button"
    class="btn btn-ghost btn-square"
    onclick={toggleTheme}
    aria-label="Toggle color mode"
>
    {#if theme === "dark"}
        ☀️
    {:else}
        🌙
    {/if}
</button>
