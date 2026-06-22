<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CardImage } from '$lib/types/content';
  import type { PageData } from './$types';
  import RelatedCardsBar from '$lib/components/RelatedCardsBar.svelte';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';
  import { composer, selectedCardIds, selectedCount, isAtLimit } from '$lib/stores/composer';

  let { data }: { data: PageData } = $props();

  let sheetOpen = $state(false);

  type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImage };

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

  function imageUrl(image: CardImage): string {
    const idx = image.path.indexOf('cards_images/');
    return idx !== -1 ? `/content/${image.path.slice(idx)}` : '';
  }

  function handleSelectRelation(cardId: string) {
    sheetOpen = false;
    goto(`/cards/${cardId}`);
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
  <article class="card bg-base-100 border border-base-300 p-6 shadow-sm lg:p-10">
    <div class="mb-5 flex items-start justify-between gap-4">
      <a class="btn btn-outline w-fit shrink-0" href="/cards">Volver al repositorio</a>
      <div class="flex items-center gap-2">
        <RelatedCardsBar
          count={data.relations.length}
          onopen={() => (sheetOpen = true)}
        />
        {#if data.relations.length > 0}
          <a
            href="/cards/graph?origin={data.card.id}"
            class="btn btn-soft"
          >
            Explorar
          </a>
        {/if}
      </div>
    </div>

    <h1 class="text-3xl font-black lg:text-4xl">{data.card.book}</h1>

    <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
      <p class="opacity-70">
        {data.card.author} ({data.card.year}) &mdash; página {data.card.page ?? 's/p'}
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-sm transition-all"
          class:btn-soft={inDocument}
          class:btn-success={inDocument}
          class:btn-ghost={!inDocument}
          disabled={addDisabled}
          onclick={toggleDocument}
          title={addDisabled ? 'Límite de 50 tarjetas alcanzado' : inDocument ? 'Quitar del documento' : 'Añadir al documento'}
        >
          {#if inDocument}
            ✓ Añadido
          {:else}
            + Añadir
          {/if}
        </button>
        {#if $selectedCount > 0}
          <a href="/cards/compose" class="btn btn-ghost btn-sm text-xs opacity-60">
            {$selectedCount} {$selectedCount === 1 ? 'tarjeta' : 'tarjetas'} en documento &rarr;
          </a>
        {/if}
      </div>
    </div>

    <div class="mt-7 space-y-4 rounded-xl border border-base-200 bg-base-200/40 p-5">
      {#each contentParts as part}
        {#if part.kind === 'text'}
          <p class="whitespace-pre-wrap leading-8 opacity-90">
            {part.text}
          </p>
        {:else}
          <figure class="my-2">
            <img
              src={imageUrl(part.image)}
              alt={part.image.alt_text ?? part.image.caption ?? ''}
              loading="lazy"
              class="max-w-full rounded-lg border border-base-200"
            />
            {#if part.image.caption}
              <figcaption class="mt-1 text-xs opacity-50">
                {part.image.caption}
              </figcaption>
            {/if}
          </figure>
        {/if}
      {/each}
    </div>
    <p class="mt-5 text-xs opacity-40">Fuente: {data.card.source_path}</p>
  </article>
</div>

<RelatedCardsSheet
  relations={data.relations}
  show={sheetOpen}
  onclose={() => (sheetOpen = false)}
  onselect={handleSelectRelation}
  currentCardId={data.card.id}
/>
