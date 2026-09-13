<script lang="ts">
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import CardImage from '$lib/components/CardImage.svelte';
  import { showToast } from '$lib/stores/toast';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import Tag from '$lib/components/Tag.svelte';
  import { TAG_DESCRIPTIONS } from '$lib/constants';
  import type { CardImage as CardImageType, CardRecord } from '$lib/types/content';
  import {
    buildCardCitationAPA,
    buildCardFullText,
    copyTextToClipboard,
  } from '$lib/utils/citation';
  import { createExcerpt, getHighlightSegments, getMatchCount } from '$lib/utils/search';
  import { stripHtml, sanitizeHtml } from '$lib/utils/html';
  import { VectorPolygon } from '@lucide/svelte';

  let {
    card,
    focused,
    searchTerms = [],
    onregister,
    onunregister,
    onopenrelations,
  }: {
    card: CardRecord;
    focused: boolean;
    searchTerms?: string[];
    onregister?: (el: HTMLElement, id: string) => void;
    onunregister?: (el: HTMLElement, id: string) => void;
    onopenrelations?: (cardId: string) => void;
  } = $props();

  let element: HTMLElement;
  let expanded = $state(false);

  const searchActive = $derived(searchTerms.length > 0);

  const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
  const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
  const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));

  const compactHtml = $derived(
    (() => {
      const cleaned = sanitizeHtml(card.content).replace(/\[\[IMAGE:\d+\]\]\n?/g, '');
      return cleaned.length > 350 ? cleaned.slice(0, 350).trimEnd() + '\u2026' : cleaned;
    })(),
  );

  const compactText = $derived(
    searchActive
      ? createExcerpt(stripHtml(card.content), searchTerms)
      : stripHtml(card.content)
          .replace(/\[\[IMAGE:\d+\]\]\n?/g, '')
          .slice(0, 350),
  );
  const contentSegments = $derived(getHighlightSegments(compactText, searchTerms));

  const matchCount = $derived(
    searchActive
      ? getMatchCount(
          [card.title, card.author, card.book, card.page ?? '', stripHtml(card.content)].join(' '),
          searchTerms,
        )
      : 0,
  );

  const visibleTags = $derived(card.tags?.filter((tag) => tag.trim().length > 0) ?? []);

  type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImageType };
  const expandedParts = $derived.by<ContentPart[]>(() => {
    const imageMap = new Map(card.images.map((img) => [img.placeholder_id, img]));
    const chunks = card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
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

  async function copyCitation() {
    const copied = await copyTextToClipboard(buildCardCitationAPA(card));
    showToast(copied ? 'Cita copiada' : 'No se pudo copiar', copied ? 'success' : 'error');
  }

  async function copyCardText() {
    const copied = await copyTextToClipboard(buildCardFullText(card));
    showToast(copied ? 'Texto copiado' : 'No se pudo copiar', copied ? 'success' : 'error');
  }

  const inDocument = $derived($selectedCardIds.includes(card.id));
  const addDisabled = $derived(!inDocument && $isAtLimit);

  function toggleDocument() {
    if (inDocument) {
      composer.removeCard(card.id);
    } else if (!$isAtLimit) {
      composer.addCard(card.id);
    }
  }

  $effect(() => {
    if (!element) return;
    const id = card.id;
    onregister?.(element, id);
    return () => {
      onunregister?.(element, id);
    };
  });
</script>

<article
  bind:this={element}
  id={`card-${card.id}`}
  data-card-id={card.id}
  class={`card bg-base-100 border transition-colors ${focused ? 'border-primary shadow-sm' : 'border-base-300'}`}
  style="scroll-margin-top: var(--header-height, 7rem)"
>
  <div class="card-body p-5">
    <!-- Header: author + book on left, page on right -->
    <div class="flex flex-wrap items-center gap-2">
      <p class="font-bold min-w-0 flex-1">
        <HighlightedText segments={authorSegments} />
        <span> &mdash; </span>
        <HighlightedText segments={bookSegments} />
      </p>
      <div class="flex items-center gap-2 shrink-0 ml-auto">
        {#if searchActive}
          <span class="badge badge-warning badge-sm text-xs">{matchCount} coinc.</span>
        {/if}
        <span class="badge badge-ghost badge-sm tabular-nums font-semibold">
          p. <HighlightedText segments={pageSegments} />
        </span>
        <a
          href="/cards/{card.id}"
          class="btn btn-ghost btn-xs btn-square"
          title="Ver tarjeta"
          onclick={() => sessionStorage.setItem('cards:returnTo', card.id)}
        >
          →
        </a>
      </div>
    </div>

    <!-- Content: preview or expanded -->
    {#if expanded}
      <div class="mt-1 space-y-3">
        {#each expandedParts as part}
          {#if part.kind === 'text'}
            <p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
              {#if searchActive}
                <HighlightedText
                  segments={getHighlightSegments(stripHtml(part.text), searchTerms)}
                />
              {:else}
                {@html part.text}
              {/if}
            </p>
          {:else}
            <CardImage image={part.image} />
          {/if}
        {/each}
        <p class="text-xs opacity-40">
          <button type="button" class="link link-hover" onclick={copyCitation}>Copiar cita</button>
          ·
          <button type="button" class="link link-hover" onclick={copyCardText}>Copiar texto</button>
        </p>
      </div>
    {:else}
      <p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
        {#if searchActive}
          <HighlightedText segments={contentSegments} />
        {:else}
          {@html compactHtml}
        {/if}
      </p>
    {/if}

    <!-- Full-width toggle bar -->
    <button
      type="button"
      class="btn btn-ghost btn-sm w-full mt-2 text-xs opacity-60"
      onclick={() => (expanded = !expanded)}
    >
      {expanded ? 'Ocultar contenido' : 'Mostrar contenido'}
      <span class="ml-1">{expanded ? '\u2191' : '\u2193'}</span>
    </button>

    <!-- Controls bar: tags left, actions right -->
    <div class="card-actions flex-nowrap items-center justify-between mt-1">
      <div class="flex flex-wrap gap-1 items-end">
        {#each visibleTags as tag}
          <div
            class="tooltip tooltip-top before:whitespace-normal before:max-w-50"
            data-tip={TAG_DESCRIPTIONS[tag] ?? 'Sin descripción'}
          >
            <Tag {tag} onclick={() => openCardsSearch([tag])} />
          </div>
        {/each}
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="btn btn-xs md:btn-sm btn-ghost transition-all"
          onclick={() => onopenrelations?.(card.id)}
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
  </div>
</article>
