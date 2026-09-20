<script lang="ts">
  import { VectorPolygon, MapPin } from '@lucide/svelte';

  let {
    variant = 'minimal',
    cardId,
    inComposer = false,
    composerDisabled = false,
    onOpenRelations,
    onToggleComposer,
    left,
  }: {
    variant?: 'minimal' | 'graph' | 'full';
    cardId: string;
    inComposer?: boolean;
    composerDisabled?: boolean;
    onOpenRelations?: (id: string) => void;
    onToggleComposer?: (id: string) => void;
    left?: import('svelte').Snippet;
  } = $props();
</script>

{#if variant === 'graph'}
  <div class="flex items-stretch gap-2">
    <a
      href="/cards/graph?origin={encodeURIComponent(cardId)}&depth=1"
      class="btn btn-outline btn-sm flex-1 justify-center"
    >
      <MapPin class="size-3 stroke-3" aria-hidden="true" />
      <span>Explorar desde aqu&iacute;</span>
    </a>
    <button
      type="button"
      class="btn btn-sm min-w-28 transition-all"
      class:btn-soft={inComposer}
      class:btn-success={inComposer}
      class:btn-ghost={!inComposer}
      disabled={composerDisabled}
      onclick={() => onToggleComposer?.(cardId)}
      title={composerDisabled
        ? 'Límite de 50 tarjetas alcanzado'
        : inComposer
          ? 'Quitar del documento'
          : 'Añadir al documento'}
    >
      {inComposer ? 'Añadida' : 'Añadir'}
    </button>
  </div>
{:else if variant === 'full'}
  <div class="card-actions flex-nowrap items-center justify-between">
    {#if left}{@render left()}{/if}
    <div class="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        class="btn btn-xs md:btn-sm btn-ghost transition-all"
        onclick={() => onOpenRelations?.(cardId)}
        title="Ver tarjetas relacionadas"
      >
        <VectorPolygon size="1em" />
        <span class="hidden md:inline">Red</span>
      </button>
      <button
        type="button"
        class="btn btn-xs md:btn-sm btn-ghost transition-all"
        class:btn-soft={inComposer}
        class:btn-success={inComposer}
        class:btn-ghost={!inComposer}
        disabled={composerDisabled}
        onclick={() => onToggleComposer?.(cardId)}
        title={composerDisabled
          ? 'Límite de 50 tarjetas alcanzado'
          : inComposer
            ? 'Quitar del documento'
            : 'Añadir al documento'}
      >
        {inComposer ? 'Añadida' : 'Añadir'}
      </button>
    </div>
  </div>
{/if}
