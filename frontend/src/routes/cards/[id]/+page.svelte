<script lang="ts">
  import { goto } from '$app/navigation';
  import CardImage from '$lib/components/CardImage.svelte';
  import type { CardImage as CardImageType } from '$lib/types/content';
  import type { PageData } from './$types';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import { showToast } from '$lib/stores/toast';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { TAG_DESCRIPTIONS } from '$lib/constants';
  import {
    buildCardCitationAPA,
    buildCardFullText,
    copyTextToClipboard,
  } from '$lib/utils/citation';

  let { data }: { data: PageData } = $props();

  let sheetOpen = $state(false);

  type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImageType };

  const contentParts = $derived.by<ContentPart[]>(() => {
    const imageMap = new Map(data.card.images.map((img) => [img.placeholder_id, img]));
    const chunks = data.card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
    const parts: ContentPart[] = [];
    for (let i = 0; i < chunks.length; i++) {
      if (i % 2 === 0) {
        if (chunks[i].trim()) parts.push({ kind: 'text', text: chunks[i] });
      } else {
        const img = imageMap.get(Number(chunks[i]));
        if (img) parts.push({ kind: 'image', image: img });
      }
    }
    return parts;
  });


  function handleSelectRelation(cardId: string) {
    sheetOpen = false;
    goto(`/cards/${cardId}`);
  }

  async function copyCitation() {
    const copied = await copyTextToClipboard(buildCardCitationAPA(data.card));
    showToast(copied ? 'Cita copiada' : 'No se pudo copiar', copied ? 'success' : 'error');
  }

  async function copyCardText() {
    const copied = await copyTextToClipboard(buildCardFullText(data.card));
    showToast(copied ? 'Texto copiado' : 'No se pudo copiar', copied ? 'success' : 'error');
  }

  const inDocument = $derived($selectedCardIds.includes(data.card.id));
  const addDisabled = $derived(!inDocument && $isAtLimit);

  function toggleDocument() {
    if (inDocument) {
      composer.removeCard(data.card.id);
    } else if (!$isAtLimit) {
      composer.addCard(data.card.id);
    }
  }

  const visibleTags = $derived(data.card.tags?.filter((tag) => tag.trim().length > 0) ?? []);
</script>

<svelte:head>
  <title>{data.card.author} - {data.card.book} | Significado Total</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 lg:px-10">
  <article class="card bg-base-100 border border-base-300 p-6 shadow-sm lg:p-10">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
      {#if data.fromGraph && data.graphOrigin}
        <a class="btn btn-outline shrink-0" href="/cards/graph?origin={encodeURIComponent(data.graphOrigin)}">
          ← Volver a la red
        </a>
      {:else}
        <a class="btn btn-outline shrink-0" href="/cards">← Volver al repositorio</a>
      {/if}
      {#if data.relations.length > 0}
        <button
          type="button"
          class="btn btn-ghost btn-xs md:btn-sm gap-1"
          onclick={() => (sheetOpen = true)}
          title="Tarjetas relacionadas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
            <path d="M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9c0-44.2-35.8-80-80-80c-43.4 0-78.7 34.5-80 77.5L136.2 151.1C121.7 136.8 101.9 128 80 128c-44.2 0-80 35.8-80 80s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2c0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z"/>
          </svg>
          <span>{data.relations.length}</span>
        </button>
      {/if}
    </div>

    <h1 class="text-3xl font-black lg:text-4xl">{data.card.book}</h1>
    <p class="mt-2 opacity-70">
      {data.card.author} ({data.card.year}) &mdash; página {data.card.page ?? 's/p'}
    </p>

    <div class="mt-7 space-y-4 rounded-xl border border-base-200 bg-base-200/40 p-5">
      {#each contentParts as part}
        {#if part.kind === 'text'}
          <p class="whitespace-pre-wrap leading-8 opacity-90">
            {part.text}
          </p>
        {:else}
          <CardImage image={part.image} />
        {/if}
      {/each}
    </div>

    <!-- Controls bar: tags left, actions right -->
    <div class="card-actions flex-nowrap items-center justify-between mt-5">
      <div class="flex flex-wrap gap-1 items-end">
        {#each visibleTags as tag}
          <div
            class="tooltip tooltip-top before:whitespace-normal before:max-w-50"
            data-tip={TAG_DESCRIPTIONS[tag] ?? 'Sin descripción'}
          >
            <button
              type="button"
              class="badge badge-outline badge-sm text-[10px] uppercase tracking-wider opacity-60 transition-colors hover:badge-primary hover:opacity-100 cursor-pointer"
              onclick={() => openCardsSearch([tag])}
            >
              {tag}
            </button>
          </div>
        {/each}
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="btn btn-xs md:btn-sm btn-ghost transition-all"
          onclick={() => (sheetOpen = true)}
          title="Ver tarjetas relacionadas"
        >
          <span aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor">
              <path d="M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9c0-44.2-35.8-80-80-80c-43.4 0-78.7 34.5-80 77.5L136.2 151.1C121.7 136.8 101.9 128 80 128c-44.2 0-80 35.8-80 80s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2c0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z"/>
            </svg>
          </span>
          <span class="hidden md:inline">Red</span>
        </button>
        <button
          type="button"
          class="btn btn-xs md:btn-sm transition-all"
          class:btn-soft={inDocument}
          class:btn-success={inDocument}
          class:btn-ghost={!inDocument}
          disabled={addDisabled}
          onclick={toggleDocument}
          title={addDisabled ? 'Límite de 50 tarjetas alcanzado' : inDocument ? 'Quitar del documento' : 'Añadir al documento'}
        >
          {#if inDocument}
            <span aria-hidden="true">✓</span>
            <span class="hidden md:inline">Añadido</span>
          {:else}
            <span aria-hidden="true">+</span>
            <span class="hidden md:inline">Añadir</span>
          {/if}
        </button>
      </div>
    </div>

    <p class="mt-5 text-xs opacity-40">
      Fuente: {data.card.source_path}
      · <button type="button" class="link link-hover" onclick={copyCitation}>Copiar cita</button>
      · <button type="button" class="link link-hover" onclick={copyCardText}>Copiar texto</button>
    </p>
  </article>
</div>

<RelatedCardsSheet
  relations={data.relations}
  show={sheetOpen}
  onclose={() => (sheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={data.card.id}
/>
