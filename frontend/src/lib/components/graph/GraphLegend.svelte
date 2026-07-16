<script lang="ts">
  let {
    authorColors,
    onclose,
  }: {
    authorColors: Map<string, string>;
    onclose: () => void;
  } = $props();

  const entries = $derived([...authorColors.entries()]);
</script>

<div
  class="absolute right-3 top-3 z-40 w-56 rounded-xl border border-base-300 bg-base-100 p-4 shadow-lg"
>
  <div class="mb-3 flex items-center justify-between">
    <span class="text-sm font-semibold">Leyenda</span>
    <button class="btn btn-ghost btn-xs" onclick={onclose} aria-label="Cerrar leyenda"> ✕ </button>
  </div>

  <!-- Author colors -->
  <div class="space-y-1.5">
    <p class="text-xs font-semibold opacity-50">Autores</p>
    {#each entries as [author, color]}
      <div class="flex items-center gap-2">
        <span class="inline-block h-3 w-3 shrink-0 rounded-full" style="background-color: {color}"
        ></span>
        <span class="truncate text-xs">{author}</span>
      </div>
    {/each}
  </div>

  <!-- Size legend -->
  <div class="mt-4 space-y-2">
    <p class="text-xs font-semibold opacity-50">Conexiones</p>
    <div class="flex items-end gap-2">
      <div class="flex flex-col items-center gap-1">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" fill="#888" opacity="0.4" />
        </svg>
        <span class="text-[10px] opacity-40">Pocas</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="12" fill="#888" opacity="0.4" />
        </svg>
        <span class="text-[10px] opacity-40">Medio</span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="24" fill="#888" opacity="0.4" />
        </svg>
        <span class="text-[10px] opacity-40">Muchas</span>
      </div>
    </div>
  </div>
</div>
