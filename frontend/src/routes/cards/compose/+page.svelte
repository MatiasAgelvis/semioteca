<script lang="ts">
  import { composer, selectedCount } from '$lib/stores/composer';
  import { CARD_LIMIT } from '$lib/types/composer';
  import { buildDocumentMarkdown } from '$lib/utils/composer-markdown';
  import { downloadPdf, downloadMarkdown } from '$lib/utils/composer-pdf';
  import { showToast } from '$lib/stores/toast';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const cardMap = $derived(new Map(data.cards.map((c) => [c.id, c])));

  let title = $state($composer.title);
  let subtitle = $state($composer.subtitle ?? '');
  let compiler = $state($composer.compiler ?? '');
  let intro = $state($composer.intro ?? '');
  let metadataOpen = $state($composer.title === '');
  let previewedCardId = $state<string | null>(null);

  $effect(() => {
    composer.updateMeta({
      title,
      subtitle: subtitle || undefined,
      compiler: compiler || undefined,
      intro: intro || undefined,
    });
  });

  function handleExportPdf() {
    if ($selectedCount === 0) return;
    downloadPdf($composer, cardMap);
  }

  function handleDownloadMd() {
    if ($selectedCount === 0) return;

    const markdown = buildDocumentMarkdown($composer, cardMap);
    const docTitle = title || 'Documento sin título';

    downloadMarkdown(markdown, docTitle);
    showToast('Documento Markdown descargado', 'success');
  }

  function handleClear() {
    composer.clearDocument();
    title = '';
    subtitle = '';
    compiler = '';
    intro = '';
    showToast('Documento vaciado', 'info');
  }

  function cardPreview(cardId: string): string {
    const card = cardMap.get(cardId);
    if (!card) return '';
    const stripped = card.content.replace(/\[\[IMAGE:\d+\]\]\n?/g, '');
    return stripped.length > 200 ? stripped.slice(0, 200).trimEnd() + '…' : stripped;
  }

  function togglePreview(cardId: string) {
    previewedCardId = previewedCardId === cardId ? null : cardId;
  }

  function cardLabel(cardId: string): string {
    const card = cardMap.get(cardId);
    if (!card) return '(Tarjeta no encontrada)';
    return `${card.author} \u2014 ${card.book}, p. ${card.page ?? 's.p.'}`;
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
    <div class="collapse collapse-arrow border border-base-300/70 rounded-box mb-6" class:collapse-open={metadataOpen}>
      <input type="checkbox" bind:checked={metadataOpen} />
      <div class="collapse-title text-sm font-medium opacity-60">
        Metadatos
        {#if title}
          <span class="font-normal opacity-40"> &mdash; {title}</span>
        {/if}
      </div>
      <div class="collapse-content">
        <div class="space-y-4 pt-1">

          <div>
            <label for="doc-title" class="block text-sm font-medium opacity-60">Título del documento</label>
            <input
              id="doc-title"
              type="text"
              class="mt-1 block w-full input input-bordered"
              placeholder="Compendio de semiótica contemporánea"
              bind:value={title}
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
              bind:value={subtitle}
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
              bind:value={compiler}
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
              bind:value={intro}
            ></textarea>
          </div>

        </div>
      </div>
    </div>

    <!-- Card list -->
    <div class="mt-8">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-semibold uppercase tracking-widest opacity-40">
          Tarjetas &middot; {$selectedCount} <span class="text-[10px] opacity-30">/ {CARD_LIMIT}</span>
        </h2>
        {#if $selectedCount > 0}
          <button type="button" class="btn btn-ghost btn-sm text-error" onclick={handleClear}>
            Vaciar
          </button>
        {/if}
      </div>

      {#if $selectedCount === 0}
        <div class="mt-4 rounded-lg border border-dashed border-base-300 p-8 text-center">
          <p class="text-sm opacity-50">
            No hay tarjetas seleccionadas. Ve al{' '}
            <a href="/cards" class="link link-primary">repositorio</a> y añade tarjetas al documento.
          </p>
        </div>
      {:else}
        <div class="mt-4 overflow-hidden rounded-lg border border-base-200">
          {#each sortedItems as item, index (item.cardId)}
            <div
              class="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-base-200"
              class:border-b={index < $selectedCount - 1}
              class:border-base-200={index < $selectedCount - 1}
            >
              <div class="flex min-w-0 items-center gap-3">
                <span class="font-mono text-xs opacity-40 shrink-0">#{item.order}</span>
                <button type="button" class="truncate text-sm text-left hover:underline cursor-pointer" onclick={() => togglePreview(item.cardId)}>{cardLabel(item.cardId)}</button>
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
                <p class="text-sm leading-relaxed opacity-70 pl-7 border-l-2 border-base-300 ml-2 whitespace-pre-wrap">
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
        disabled={$selectedCount === 0}
        onclick={handleDownloadMd}
      >
        Descargar MD
      </button>
      <button
        type="button"
        class="btn btn-primary"
        disabled={$selectedCount === 0}
        onclick={handleExportPdf}
      >
        Exportar PDF
      </button>
    </div>
  </div>
