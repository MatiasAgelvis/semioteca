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

  // Sync local state -> store on change
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

    const markdown = buildDocumentMarkdown($composer, cardMap);
    const docTitle = title || 'Documento sin título';

    downloadPdf(markdown, docTitle, () => {
      showToast('Permite ventanas emergentes para exportar el PDF', 'error');
    });
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

  function cardLabel(cardId: string): string {
    const card = cardMap.get(cardId);
    if (!card) return '(Tarjeta no encontrada)';
    return `${card.author} — ${card.book}, p. ${card.page ?? 's.p.'}`;
  }

  const sortedItems = $derived([...$composer.items].sort((a, b) => a.order - b.order));
</script>

<svelte:head>
  <title>Compositor de documento | Significado Total</title>
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-5 py-10 lg:px-10">
  <a href="/cards" class="btn btn-ghost btn-sm mb-6">Volver a tarjetas</a>

  <h1 class="text-2xl font-black">Compositor de documento</h1>
  <p class="mt-1 text-sm opacity-60">
    Organiza las tarjetas seleccionadas, edita los metadatos y exporta el documento.
  </p>

  <!-- Metadata form -->
  <section class="mt-8 space-y-4">
    <h2 class="text-sm font-semibold uppercase tracking-wider opacity-50">Metadatos del documento</h2>

    <label class="form-control w-full">
      <span class="label">
        <span class="label-text">Título del documento</span>
      </span>
      <input
        type="text"
        class="input input-bordered w-full"
        placeholder="Ej: Compendio de semiótica contemporánea"
        bind:value={title}
      />
    </label>

    <label class="form-control w-full">
      <span class="label">
        <span class="label-text">Subtítulo</span>
        <span class="label-text-alt">Opcional</span>
      </span>
      <input
        type="text"
        class="input input-bordered w-full"
        placeholder="Ej: Una selección de fichas bibliográficas"
        bind:value={subtitle}
      />
    </label>

    <label class="form-control w-full">
      <span class="label">
        <span class="label-text">Compilador</span>
        <span class="label-text-alt">Opcional</span>
      </span>
      <input
        type="text"
        class="input input-bordered w-full"
        placeholder="Tu nombre"
        bind:value={compiler}
      />
    </label>

    <label class="form-control w-full">
      <span class="label">
        <span class="label-text">Nota introductoria</span>
        <span class="label-text-alt">Opcional</span>
      </span>
      <textarea
        class="textarea textarea-bordered w-full"
        rows={4}
        placeholder="Una breve introducción al documento..."
        bind:value={intro}
      ></textarea>
    </label>
  </section>

  <!-- Card list -->
  <section class="mt-8">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider opacity-50">
        Tarjetas &middot; {$selectedCount} de {CARD_LIMIT}
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
              <span class="truncate text-sm">{cardLabel(item.cardId)}</span>
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
        {/each}
      </div>
    {/if}
  </section>

  <!-- Export actions -->
  <section class="mt-8 flex flex-wrap items-center justify-end gap-3">
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
  </section>
</div>
