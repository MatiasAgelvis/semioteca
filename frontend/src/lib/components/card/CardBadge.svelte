<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'page',
    children,
  }: {
    variant?: 'page' | 'match' | 'score';
    children?: Snippet;
  } = $props();
</script>

{#if variant === 'match'}
  <span class="badge badge-warning badge-sm text-xs">
    {@render children?.()}
  </span>
{:else if variant === 'score'}
  <span class="badge badge-ghost badge-sm tabular-nums font-semibold">
    {@render children?.()}
  </span>
{:else}
  <span class="badge badge-ghost badge-sm tabular-nums font-semibold">
    {@render children?.()}
  </span>
{/if}
