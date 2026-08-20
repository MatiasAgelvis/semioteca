<script lang="ts">
  import { GRAPH_DEPTHS, type GraphDepth } from '$lib/types/graph';

  let {
    depth,
    legendOpen,
    onDepthChange,
    onLegendToggle,
    onRecenter,
  }: {
    depth: GraphDepth;
    legendOpen: boolean;
    onDepthChange: (d: GraphDepth) => void;
    onLegendToggle: () => void;
    onRecenter: () => void;
  } = $props();

  const depths = GRAPH_DEPTHS.map((value) => ({ value, label: String(value) }));
</script>

<div
  class="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-base-300 bg-base-100/90 p-1.5 shadow-sm backdrop-blur-md"
>
  <div class="flex items-center gap-1" role="group" aria-label="Profundidad">
    <span class="hidden pl-1 text-xs text-base-content/50 sm:inline">Profundidad</span>
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
  <button
    class="btn btn-ghost btn-sm btn-square"
    onclick={onRecenter}
    aria-label="Re-centrar"
    title="Centrar"
  >
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
  </button>

  <!-- Legend toggle -->
  <button
    class="btn btn-ghost btn-sm btn-square"
    class:btn-active={legendOpen}
    onclick={onLegendToggle}
    aria-label="Leyenda"
    title="Leyenda"
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
  </button>
</div>
