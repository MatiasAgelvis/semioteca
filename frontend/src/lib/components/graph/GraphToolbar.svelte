<script lang="ts">
  let { origin }: { origin: string } = $props();
</script>

<div class="flex items-center justify-between gap-3">
  <a class="btn btn-outline btn-sm shrink-0" href="/cards/{origin}">← Volver a la tarjeta</a>
</div>
