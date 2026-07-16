<script lang="ts">
  import type { GraphDepth } from '$lib/types/graph';

  let {
    depth,
    origin,
    legendOpen,
    onDepthChange,
    onLegendToggle,
    onRecenter,
  }: {
    depth: GraphDepth;
    origin: string;
    legendOpen: boolean;
    onDepthChange: (d: GraphDepth) => void;
    onLegendToggle: () => void;
    onRecenter: () => void;
  } = $props();

  const depths: { value: GraphDepth; label: string }[] = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
  ];
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
  <a class="btn btn-outline btn-sm shrink-0" href="/cards/{origin}"> ← Volver a la tarjeta </a>

  <div class="flex items-center gap-3">
    <!-- Depth selector -->
    <div class="flex items-center gap-1">
      <span class="text-xs opacity-50">Profundidad</span>
      <div class="join">
        {#each depths as d}
          <button
            class="btn join-item btn-xs"
            class:btn-active={depth === d.value}
            class:btn-neutral={depth === d.value}
            onclick={() => onDepthChange(d.value)}
          >
            {d.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Legend toggle -->
    <button class="btn btn-ghost btn-sm" class:btn-active={legendOpen} onclick={onLegendToggle}>
      ◎ Leyenda
    </button>

    <!-- Re-center -->
    <button class="btn btn-ghost btn-sm" onclick={onRecenter} aria-label="Re-centrar">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  </div>
</div>
