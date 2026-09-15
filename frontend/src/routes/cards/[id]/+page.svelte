<script lang="ts">
  import type { PageData } from './$types';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import { showToast } from '$lib/stores/toast';
  import {
    buildCardCitationAPA,
    buildCardFullText,
    copyTextToClipboard,
  } from '$lib/utils/citation';
  import { sanitizeHtml } from '$lib/utils/html';
  import CardHeader from '$lib/components/card/CardHeader.svelte';
  import CardContent from '$lib/components/card/CardContent.svelte';
  import CardTags from '$lib/components/card/CardTags.svelte';
  import { VectorPolygon } from '@lucide/svelte';
  import { openCardsSearch } from '$lib/stores/cardsSearch';

  let { data }: { data: PageData } = $props();

  let sheetOpen = $state(false);

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
      <CardHeader
        author={data.card.author}
        book={data.card.book}
        year={data.card.year}
        page={data.card.page}
        variant="full"
      />
    </div>

    <!-- Content container -->
    <div class="mt-7 space-y-4 rounded-box border border-base-200 bg-base-200/40 p-5">
      <CardContent text={data.card.content} mode="full" images={data.card.images} />
      <p class="mt-5 text-xs opacity-40">
        <button type="button" class="link link-hover" onclick={copyCitation}>Copiar cita</button>
        · <button type="button" class="link link-hover" onclick={copyCardText}>Copiar texto</button>
      </p>
    </div>

    <!-- Controls bar: tags left, actions right -->
    <div class="card-actions flex-nowrap items-center justify-between mt-5">
      <CardTags
        tags={data.card.tags}
        variant="interactive"
        onTagClick={(tag) => {
          openCardsSearch([tag]);
        }}
      />
      <div class="flex flex-wrap items-center justify-end gap-2 ml-auto">
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
