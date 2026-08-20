<script lang="ts">
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { GraphNode } from '$lib/types/graph';
  import CloseIcon from '$lib/components/CloseIcon.svelte';

  let {
    node,
    origin,
    onclose,
  }: {
    node: GraphNode | null;
    origin: string;
    onclose: () => void;
  } = $props();

  const visibleTags = $derived(node?.tags?.filter((t) => t.trim().length > 0) ?? []);

  function handleViewCard() {
    if (!node) return;
    goto(`/cards/${node.id}?from=graph&origin=${encodeURIComponent(origin)}`);
  }
</script>

{#if node}
  <div
    transition:fly={{ x: 320, duration: 250, easing: cubicOut }}
    class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl lg:static lg:z-auto lg:w-[28rem] lg:max-w-none lg:shrink-0 lg:rounded-xl lg:border lg:border-base-300 lg:bg-base-200/50 lg:shadow-none"
    role="dialog"
    aria-label="Vista previa de la tarjeta"
    tabindex="-1"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-base-200 px-5 py-3">
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold">{node.book}</p>
        <p class="truncate text-xs opacity-60">
          {node.author} ({node.year}){node.page ? ` · p. ${node.page}` : ''}
        </p>
      </div>
      <button
        class="btn btn-ghost btn-sm btn-square ml-2 shrink-0"
        onclick={onclose}
        aria-label="Cerrar panel"
      >
        <CloseIcon />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-5 py-4">
      <!-- Tags -->
      {#if visibleTags.length > 0}
        <div class="mb-4 flex flex-wrap gap-1">
          {#each visibleTags as tag}
            <span
              class="badge badge-outline badge-xs text-[10px] uppercase tracking-wider opacity-50"
            >
              {tag}
            </span>
          {/each}
        </div>
      {/if}

      <!-- Full text -->
      <div class="rounded-lg border border-base-200 bg-base-200/40 p-4">
        <p class="whitespace-pre-wrap text-sm leading-relaxed opacity-80">
          {node.content || 'Sin contenido disponible.'}
        </p>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="flex items-center gap-2 border-t border-base-200 px-5 py-3">
      <button class="btn btn-neutral btn-sm flex-1" onclick={handleViewCard}>
        Ver tarjeta completa →
      </button>
      <a
        href="/cards/graph?origin={encodeURIComponent(node.id)}&depth=1"
        class="btn btn-ghost btn-sm"
      >
        Explorar desde aquí
      </a>
    </div>
  </div>
{/if}
