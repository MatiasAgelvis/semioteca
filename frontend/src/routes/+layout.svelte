<script lang="ts">
  import GlobalToast from '$lib/components/GlobalToast.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from '$lib/config/theme';
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();

  // Inline bootstrap that runs in <head> before body paint to set the correct
  // theme. Theme names are injected from $lib/config/theme so this stays a
  // single source of truth — no hardcoded theme strings here.
  const themeBootstrap = `
    (function(){
      var k=${JSON.stringify(THEME_STORAGE_KEY)};
      var l=${JSON.stringify(LIGHT_THEME)};
      var d=${JSON.stringify(DARK_THEME)};
      var stored=localStorage.getItem(k);
      document.documentElement.dataset.theme=stored||(matchMedia('(prefers-color-scheme: dark)').matches?d:l);
    })();
  `;
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  {@html `<script>${themeBootstrap}</script>`}
</svelte:head>

<div class="min-h-screen flex flex-col">
  <SiteHeader />
  <main class="flex-1">{@render children()}</main>
  <SiteFooter />
  <GlobalToast />
</div>
