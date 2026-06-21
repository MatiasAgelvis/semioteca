<script lang="ts">
  let { count, onopen }: { count: number; onopen: () => void } = $props();
</script>

{#if count > 0}
  <button class="btn btn-outline shrink-0" type="button" onclick={onopen}>
    {count}
    {count === 1 ? 'tarjeta relacionada' : 'tarjetas relacionadas'}
  </button>
{/if}
