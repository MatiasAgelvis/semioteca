<script lang="ts">
  import { goto } from '$app/navigation';
  import type { CardImage } from '$lib/types/content';
  import type { PageData } from './$types';
  import RelatedCardsBar from '$lib/components/RelatedCardsBar.svelte';
  import RelatedCardsSheet from '$lib/components/RelatedCardsSheet.svelte';

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
</script>

<svelte:head>
  <title>{data.card.author} - {data.card.book} | Significado Total</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-5 py-10 lg:px-10">
  <article class="card bg-base-100 border border-base-300 p-6 shadow-sm lg:p-10">
    <div class="mb-5 flex items-start justify-between gap-4">
      <a class="btn btn-outline w-fit shrink-0" href="/cards">← Volver al repositorio</a>
      <div class="flex items-center gap-2">
        <RelatedCardsBar
          count={data.relations.length}
          onopen={() => (sheetOpen = true)}
        />
        {#if data.relations.length > 0}
          <a
            href="/cards/graph?origin={data.card.id}"
            class="btn btn-ghost btn-xs"
            title="Explorar en grafo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
              <path fill-rule="evenodd" d="M4.5 2.25a.75.75 0 0 0 0 1.5h1.585L3.22 7.61a.75.75 0 0 0 1.06 1.06L7.145 4.815v1.585a.75.75 0 0 0 1.5 0V2.25h-4ZM6.75 9a.75.75 0 0 0 0 1.5h1.585L3.22 15.11a.75.75 0 0 0 1.06 1.06l4.115-4.115v1.585a.75.75 0 0 0 1.5 0V9h-4Zm3-4a.75.75 0 0 1 .75-.75h.75v-.75a.75.75 0 0 1 1.5 0v.75h.75a.75.75 0 0 1 0 1.5h-.75v.75a.75.75 0 0 1-1.5 0V6h-.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
            </svg>
          </a>
        {/if}
      </div>
    </div>
    <h1 class="text-3xl font-black lg:text-4xl">{data.card.book}</h1>
    <p class="mt-2 opacity-70">
      {data.card.author} ({data.card.year}) — página {data.card.page ?? 's/p'}
    </p>
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
