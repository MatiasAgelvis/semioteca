<script lang="ts">
  import { goto } from '$app/navigation';
  import GlobalToast from '$lib/components/GlobalToast.svelte';
  import SearchDialog from '$lib/components/SearchDialog.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from '$lib/config/theme';
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();

  const themeBootstrap = `
    (function(){
      var k=${JSON.stringify(THEME_STORAGE_KEY)};
      var l=${JSON.stringify(LIGHT_THEME)};
      var d=${JSON.stringify(DARK_THEME)};
      var stored=localStorage.getItem(k);
      document.documentElement.dataset.theme=stored||(matchMedia('(prefers-color-scheme: dark)').matches?d:l);
    })();
  `;

  function handleGlobalSelect(card: { id: string }) {
    goto(`/cards/${card.id}`);
  }
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
  <SearchDialog onselect={handleGlobalSelect} />
</div>
