<script lang="ts">
  import { Flag } from '@lucide/svelte';

  let { open = $bindable() }: { open: boolean } = $props();
</script>

<button
  type="button"
  class="btn btn-ghost btn-square h-5 min-h-5 w-5 p-0 transition-opacity opacity-50 hover:opacity-100 focus:opacity-100"
  class:!opacity-100={open}
  title="Reportar o sugerir etiquetas"
  aria-label="Reportar o sugerir etiquetas"
  onclick={() => (open = !open)}
>
  <Flag size="11" />
</button>
