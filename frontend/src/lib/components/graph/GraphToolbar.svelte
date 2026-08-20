<script lang="ts">
  import { GRAPH_DEPTHS, type GraphDepth } from '$lib/types/graph';

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

  const depths = GRAPH_DEPTHS.map((value) => ({ value, label: String(value) }));
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
  <a class="btn btn-outline btn-sm shrink-0" href="/cards/{origin}"> ← Volver a la tarjeta </a>

  <div class="flex items-center gap-3">
    <!-- Depth selector -->
    <div class="flex items-center gap-1">
      <span class="text-xs text-base-content/50">Profundidad</span>
      <div class="join">
        {#each depths as d}
          <button
            class="btn join-item btn-sm btn-ghost"
            class:btn-active={depth === d.value}
            onclick={() => onDepthChange(d.value)}
          >
            {d.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="mx-0.5 h-5 w-px bg-base-300"></div>

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
        class="size-4 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
      <span class="max-sm:hidden">Centrar</span>
    </button>

    <!-- Legend toggle -->
    <button
      class="btn btn-ghost btn-sm"
      class:btn-active={legendOpen}
      onclick={onLegendToggle}
      aria-label="Leyenda"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="3.5" />
        <circle cx="7" cy="17" r="3.5" opacity="0.6" />
        <circle cx="17" cy="17" r="3.5" opacity="0.3" />
      </svg>
      <span class="max-sm:hidden">Leyenda</span>
    </button>
  </div>
</div>
