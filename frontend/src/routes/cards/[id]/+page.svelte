<script lang="ts">
  import { goto } from '$app/navigation';
  import CardImage from '$lib/components/CardImage.svelte';
  import type { CardImage as CardImageType } from '$lib/types/content';
  import type { PageData } from './$types';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import Tag from '$lib/components/Tag.svelte';
  import { showToast } from '$lib/stores/toast';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { TAG_DESCRIPTIONS } from '$lib/constants';
  import {
    buildCardCitationAPA,
    buildCardFullText,
    copyTextToClipboard,
  } from '$lib/utils/citation';
  import { sanitizeHtml } from '$lib/utils/html';
  import { LucideUmbrella, VectorPolygon } from '@lucide/svelte';

  let { data }: { data: PageData } = $props();

  let sheetOpen = $state(false);

  type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImageType };

  const contentParts = $derived.by<ContentPart[]>(() => {
    const imageMap = new Map(data.card.images.map((img) => [img.placeholder_id, img]));
    const chunks = data.card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
    const parts: ContentPart[] = [];
    for (let i = 0; i < chunks.length; i++) {
      if (i % 2 === 0) {
        if (chunks[i].trim()) parts.push({ kind: 'text', text: sanitizeHtml(chunks[i]) });
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
  <div class="mb-4">
    {#if data.fromGraph && data.graphOrigin}
      <a
        class="btn btn-outline shrink-0"
        href="/cards/graph?origin={encodeURIComponent(data.graphOrigin)}"
      >
        ← Volver a la red
      </a>
    {:else}
      <a
        class="btn btn-outline shrink-0"
        href="/cards"
        onclick={() => sessionStorage.setItem('cards:returnTo', data.card.id)}
      >
        ← Volver al repositorio
      </a>
    {/if}
  </div>

  <article class="card bg-base-100 border border-base-300 p-6 shadow-sm lg:p-10">
    <div class="flex items-start justify-between gap-4">
      <p class="min-w-0 flex-1 text-xl font-bold truncate">
        {data.card.author} — {data.card.book} ({data.card.year})
      </p>
      {#if data.card.page}
        <span class="badge badge-ghost badge-md tabular-nums font-semibold shrink-0">
          p. {data.card.page}
        </span>
      {/if}
    </div>

    <!-- Content container -->
    <div class="mt-7 space-y-4 rounded-box border border-base-200 bg-base-200/40 p-5">
      {#each contentParts as part}
        {#if part.kind === 'text'}
          <p class="whitespace-pre-wrap leading-8 opacity-90">
            {@html part.text}
          </p>
        {:else}
          <CardImage image={part.image} />
        {/if}
      {/each}
      <p class="mt-5 text-xs opacity-40">
        <button type="button" class="link link-hover" onclick={copyCitation}>Copiar cita</button>
        · <button type="button" class="link link-hover" onclick={copyCardText}>Copiar texto</button>
      </p>
    </div>

    <!-- Controls bar: tags left, actions right -->
    <div class="card-actions flex-nowrap items-center justify-between mt-5">
      <div class="flex flex-wrap gap-1 items-end">
        {#each visibleTags as tag}
          <div
            class="tooltip tooltip-top before:whitespace-normal before:max-w-50"
            data-tip={TAG_DESCRIPTIONS[tag] ?? 'Sin descripción'}
          >
            <Tag {tag} variant="outline" onclick={() => openCardsSearch([tag])} />
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
          <VectorPolygon size="1em" />
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
          title={addDisabled
            ? 'Límite de 50 tarjetas alcanzado'
            : inDocument
              ? 'Quitar del documento'
              : 'Añadir al documento'}
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
  </article>
</div>

<RelatedCardsSheet
  relations={data.relations}
  show={sheetOpen}
  onclose={() => (sheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={data.card.id}
/>
