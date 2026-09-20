<script lang="ts">
  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { GraphNode } from '$lib/types/graph';
  import CloseIcon from '$lib/components/CloseIcon.svelte';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import { MapPin } from '@lucide/svelte';
  import CardContent from '$lib/components/card/CardContent.svelte';
  import CardTags from '$lib/components/card/CardTags.svelte';

  let {
    node,
    origin,
    onclose,
  }: {
    node: GraphNode | null;
    origin: string;
    onclose: () => void;
  } = $props();

  const inDocument = $derived(node ? $selectedCardIds.includes(node.id) : false);
  const addDisabled = $derived(!inDocument && $isAtLimit);

  function handleViewCard() {
    if (!node) return;
    goto(`/cards/${node.id}?from=graph&origin=${encodeURIComponent(origin)}`);
  }

  function toggleDocument() {
    if (!node) return;
    if (inDocument) {
      composer.removeCard(node.id);
    } else if (!$isAtLimit) {
      composer.addCard(node.id);
    }
  }
</script>

{#if node}
  <div
    transition:fly={{ x: 320, duration: 250, easing: cubicOut }}
    class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl lg:static lg:z-auto lg:w-md lg:max-w-none lg:shrink-0 lg:rounded-box lg:border lg:border-base-300 lg:bg-base-200/50 lg:shadow-none"
    role="dialog"
    aria-label="Vista previa de la tarjeta"
    tabindex="-1"
  >
    <!-- Header -->
    <div class="border-b border-base-200 px-5 py-3">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <p class="truncate text-sm font-semibold">{node.book}</p>
          <button
            type="button"
            class="btn btn-ghost btn-xs shrink-0"
            onclick={handleViewCard}
            title="Ver tarjeta completa"
          >
            &rarr;
          </button>
        </div>
        <button
          class="btn btn-ghost btn-sm btn-square ml-2 shrink-0"
          onclick={onclose}
          aria-label="Cerrar panel"
        >
          <CloseIcon />
        </button>
      </div>
      <p class="truncate text-xs opacity-60">
        {node.author} ({node.year}){node.page ? ` \u00b7 p. ${node.page}` : ''}
      </p>
      {#if node.tags.length > 0}
        <div class="mt-2">
          <CardTags tags={node.tags} variant="static" />
        </div>
      {/if}
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-5 py-4">
      <div class="rounded-box border border-base-200 bg-base-200/40 p-4">
        {#if node.content}
          <CardContent text={node.content} mode="html" />
        {:else}
          <p class="whitespace-pre-wrap text-sm leading-relaxed opacity-80">
            Sin contenido disponible.
          </p>
        {/if}
      </div>
    </div>

    <!-- Footer actions -->
    <div class="flex items-stretch gap-2 border-t border-base-200 px-5 py-3">
      <a
        href="/cards/graph?origin={encodeURIComponent(node.id)}&depth=1"
        class="btn btn-outline btn-sm flex-1 justify-center"
      >
        <MapPin class="size-3 stroke-3" aria-hidden="true" />
        <span>Explorar desde aqu&iacute;</span>
      </a>
      <button
        type="button"
        class="btn btn-sm min-w-10 md:min-w-28 transition-all"
        class:btn-soft={inDocument}
        class:btn-success={inDocument}
        class:btn-ghost={!inDocument}
        disabled={addDisabled}
        onclick={toggleDocument}
        title={addDisabled
          ? 'Límite de 50 tarjetas alcanzado'
          : inDocument
            ? 'Quitar del documento'
            : 'Añadir al documento'}
      >
        {#if inDocument}
          <span aria-hidden="true">&check;</span>
          <span class="hidden md:inline">A&ntilde;adido</span>
        {:else}
          <span aria-hidden="true">+</span>
          <span class="hidden md:inline">A&ntilde;adir</span>
        {/if}
      </button>
    </div>
  </div>
{/if}
