<script lang="ts">
  import { composer, selectedCount } from '$lib/stores/composer';
  import { CARD_LIMIT } from '$lib/types/composer';
  import { downloadPdf } from '$lib/utils/composer-pdf';
  import { showToast } from '$lib/stores/toast';
  import type { CardRecord } from '$lib/types/content';

  let {
    cardMap = new Map<string, CardRecord>(),
  }: {
    cardMap?: Map<string, CardRecord>;
  } = $props();

  let expanded = $state(false);

  function handleExportPdf() {
    if ($selectedCount === 0) return;
    downloadPdf($composer, cardMap);
  }

  function handleClear() {
    composer.clearDocument();
    expanded = false;
    showToast('Documento vaciado', 'info');
  }

  function cardLabel(cardId: string): string {
    const card = cardMap.get(cardId);
    if (!card) return '(Tarjeta no encontrada)';
    return `${card.author} \u2014 ${card.book}`;
  }

  function cardPage(cardId: string): string {
    const card = cardMap.get(cardId);
    return card?.page ?? '';
  }
</script>

{#if $selectedCount > 0}
  <div
    class="sticky bottom-0 z-40 border-t border-base-300 bg-base-100"
    role="region"
    aria-label="Constructor de documento"
  >
    {#if expanded}
      <div class="mx-auto max-w-7xl px-5 py-3 lg:px-10">
        <div class="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            class="flex items-center gap-2 text-sm font-semibold btn-ghost rounded px-2 py-1 hover:bg-base-200"
            onclick={() => (expanded = false)}
            aria-label="Colapsar constructor"
          >
            {$selectedCount} <span class="text-[10px] opacity-30">/ {CARD_LIMIT}</span> tarjetas
            <span class="text-xs opacity-40">&uarr;</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-ghost btn-sm text-error" onclick={handleClear}>
              Vaciar
            </button>
            <a href="/cards/compose" class="btn btn-soft btn-sm">Abrir compositor &rarr;</a>
            <button type="button" class="btn btn-primary btn-sm" onclick={handleExportPdf}>
              Exportar PDF
            </button>
          </div>
        </div>

        <div class="max-h-64 overflow-y-auto rounded-lg border border-base-200">
          {#each [...$composer.items].sort((a, b) => a.order - b.order) as item, index (item.cardId)}
            <div
              class="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-base-200"
              class:border-b={index < $selectedCount - 1}
              class:border-base-200={index < $selectedCount - 1}
            >
              <span class="min-w-0 flex-1 truncate text-sm">
                <span class="font-mono text-xs opacity-40">#{item.order}</span>
                {' '}
                <span class="font-medium">{cardLabel(item.cardId)}</span>
                {#if cardPage(item.cardId)}
                  <span class="text-xs opacity-30">&vert;</span>
                  <span class="badge badge-ghost badge-sm text-xs">p. {cardPage(item.cardId)}</span>
                {/if}
              </span>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  disabled={index === 0}
                  onclick={() => composer.moveCard(item.cardId, 'up')}
                  aria-label="Mover arriba"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  disabled={index === $selectedCount - 1}
                  onclick={() => composer.moveCard(item.cardId, 'down')}
                  aria-label="Mover abajo"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  onclick={() => composer.removeCard(item.cardId)}
                  aria-label="Quitar del documento"
                >
                  &times;
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2 lg:px-10">
        <button
          type="button"
          class="flex items-center gap-2 text-sm font-semibold btn-ghost rounded px-2 py-1 hover:bg-base-200"
          onclick={() => (expanded = true)}
          aria-label="Expandir constructor de documento"
        >
          {$selectedCount} <span class="text-[10px] opacity-30">/ {CARD_LIMIT}</span> tarjetas
          <span class="text-xs opacity-40">&darr;</span>
        </button>
        <div class="flex items-center gap-2">
          <a href="/cards/compose" class="btn btn-ghost btn-sm">Abrir compositor &rarr;</a>
          <button type="button" class="btn btn-primary btn-sm" onclick={handleExportPdf}>
            Exportar PDF
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}
