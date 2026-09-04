<script lang="ts">
  import GlobalToast from '$lib/components/GlobalToast.svelte';
  import SiteFooter from '$lib/components/SiteFooter.svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from '$lib/config/theme';
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
  <SiteHeader />
  <main class="flex-1">{@render children()}</main>
  <SiteFooter />
  <GlobalToast />
</div>
