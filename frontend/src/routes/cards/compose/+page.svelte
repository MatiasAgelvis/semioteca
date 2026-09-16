<script lang="ts">
  import { composer, selectedCount } from '$lib/stores/composer';
  import { CARD_LIMIT } from '$lib/types/composer';
  import { exportDocumentAsMarkdown, exportDocumentAsPdf } from '$lib/utils/composer-export';
  import { stripHtml, sanitizeHtml } from '$lib/utils/html';
  import { exporting } from '$lib/stores/export';
  import { showToast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const cardMap = $derived(new Map(data.cards.map((c) => [c.id, c])));

  // Document metadata reads from / writes to the store directly. No local copies,
  // so any clear (tray, this page, or a future code path) propagates automatically.
  let metadataOpen = $state($composer.title === '');
  let previewedCardId = $state<string | null>(null);

  async function handleExportPdf() {
    if ($selectedCount === 0) return;
    await exportDocumentAsPdf($composer, cardMap);
  }

  async function handleDownloadMd() {
    if ($selectedCount === 0) return;
    await exportDocumentAsMarkdown($composer, cardMap, $composer.title);
  }

  function handleClear() {
    composer.clearDocument();
    showToast('Documento vaciado', 'info');
  }

  function cardPreview(cardId: string): string {
    const card = cardMap.get(cardId);
    if (!card) return '';
    const stripped = stripHtml(card.content).replace(/\[\[IMAGE:\d+\]\]\n?/g, '');
    return stripped.length > 350 ? stripped.slice(0, 350).trimEnd() + '…' : stripped;
  }

  function togglePreview(cardId: string) {
    previewedCardId = previewedCardId === cardId ? null : cardId;
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

  const sortedItems = $derived([...$composer.items].sort((a, b) => a.order - b.order));
</script>

<svelte:head>
  <title>Compositor de documento | Significado Total</title>
</svelte:head>

<div class="mx-auto w-full max-w-2xl px-5 py-10 lg:px-10">
  <a href="/cards" class="btn btn-ghost btn-sm mb-6">← Volver al repositorio</a>

  <h1 class="text-3xl font-bold mb-6">Compositor de documento</h1>

  <!-- Metadata accordion -->
  <div
    class="collapse collapse-arrow border border-base-300/70 rounded-box mb-6"
    class:collapse-open={metadataOpen}
  >
    <input type="checkbox" bind:checked={metadataOpen} />
    <div class="collapse-title text-sm font-medium opacity-60">
      Metadatos
      {#if $composer.title}
        <span class="font-normal opacity-40"> &mdash; {$composer.title}</span>
      {/if}
    </div>
    <div class="collapse-content">
      <div class="space-y-4 pt-1">
        <div>
          <label for="doc-title" class="block text-sm font-medium opacity-60"
            >Título del documento</label
          >
          <input
            id="doc-title"
            type="text"
            class="mt-1 block w-full input input-bordered"
            placeholder="Compendio de semiótica contemporánea"
            value={$composer.title}
            oninput={(e) => composer.updateMeta({ title: e.currentTarget.value })}
          />
        </div>

        <div>
          <label for="doc-subtitle" class="block text-sm font-medium opacity-60"
            >Subtítulo <span class="opacity-40 font-normal">— opcional</span></label
          >
          <input
            id="doc-subtitle"
            type="text"
            class="mt-1 block w-full input input-bordered"
            placeholder="Una selección de fichas bibliográficas"
            value={$composer.subtitle ?? ''}
            oninput={(e) => composer.updateMeta({ subtitle: e.currentTarget.value || undefined })}
          />
        </div>

        <div>
          <label for="doc-compiler" class="block text-sm font-medium opacity-60"
            >Compilador <span class="opacity-40 font-normal">— opcional</span></label
          >
          <input
            id="doc-compiler"
            type="text"
            class="mt-1 block w-full input input-bordered"
            placeholder="Tu nombre"
            value={$composer.compiler ?? ''}
            oninput={(e) => composer.updateMeta({ compiler: e.currentTarget.value || undefined })}
          />
        </div>

        <div>
          <label for="doc-intro" class="block text-sm font-medium opacity-60"
            >Nota introductoria <span class="opacity-40 font-normal">— opcional</span></label
          >
          <textarea
            id="doc-intro"
            class="mt-1 block w-full textarea textarea-bordered"
            rows={4}
            placeholder="Una breve introducción al documento..."
            value={$composer.intro ?? ''}
            oninput={(e) => composer.updateMeta({ intro: e.currentTarget.value || undefined })}
          ></textarea>
        </div>
      </div>
    </div>
  </div>

  <!-- Card list -->
  <div class="mt-8">
    <div class="flex items-center justify-between">
      <h2 class="text-xs font-semibold uppercase tracking-widest opacity-40">
        Tarjetas · {$selectedCount}
        <span class="text-[10px] opacity-30">/ {CARD_LIMIT}</span>
      </h2>
      {#if $selectedCount > 0}
        <button type="button" class="btn btn-ghost btn-sm text-error" onclick={handleClear}>
          Vaciar
        </button>
      {/if}
    </div>

    {#if $selectedCount === 0}
      <div class="mt-4 rounded-box border border-dashed border-base-300 p-8 text-center">
        <p class="text-sm opacity-50">
          No hay tarjetas seleccionadas. Ve al{' '}
          <a href="/cards" class="link link-primary">repositorio</a> y añade tarjetas al documento.
        </p>
      </div>
    {:else}
      <div class="mt-4 overflow-hidden rounded-box border border-base-200">
        {#each sortedItems as item, index (item.cardId)}
          <div
            class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-base-200"
            class:border-b={index < $selectedCount - 1}
            class:border-base-200={index < $selectedCount - 1}
          >
            <div class="flex min-w-0 items-center gap-2 flex-1">
              <span class="font-mono text-xs opacity-40 shrink-0">#{item.order}</span>
              <button
                type="button"
                class="truncate text-sm text-left hover:underline cursor-pointer min-w-0"
                onclick={() => togglePreview(item.cardId)}>{cardLabel(item.cardId)}</button
              >
              {#if cardPage(item.cardId)}
                <span class="badge badge-ghost badge-sm tabular-nums font-semibold shrink-0">
                  p. {cardPage(item.cardId)}
                </span>
              {/if}
            </div>
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
          {#if previewedCardId === item.cardId}
            <div class="px-4 pb-3">
              <p
                class="text-sm leading-relaxed opacity-70 pl-7 border-l-2 border-base-300 ml-2 whitespace-pre-wrap"
              >
                {cardPreview(item.cardId)}
              </p>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- Export actions -->
  <div class="mt-8 flex flex-wrap items-center justify-end gap-3">
    <button
      type="button"
      class="btn btn-outline"
      disabled={$selectedCount === 0 || $exporting !== null}
      onclick={handleDownloadMd}
      aria-busy={$exporting === 'markdown'}
    >
      {#if $exporting === 'markdown'}
        <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
      {/if}
      Descargar MD
    </button>
    <button
      type="button"
      class="btn btn-primary"
      disabled={$selectedCount === 0 || $exporting !== null}
      onclick={handleExportPdf}
      aria-busy={$exporting === 'pdf'}
    >
      {#if $exporting === 'pdf'}
        <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
      {/if}
      Exportar PDF
    </button>
  </div>
</div>
