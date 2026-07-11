<script lang="ts">
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import { showToast } from '$lib/stores/toast';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { composer, selectedCardIds, isAtLimit } from '$lib/stores/composer';
  import { TAG_DESCRIPTIONS } from '$lib/constants';
  import type { CardImage, CardRecord } from '$lib/types/content';
  import {
    buildCardCitationAPA,
    buildCardFullText,
    copyTextToClipboard,
  } from '$lib/utils/citation';
  import { createExcerpt, getHighlightSegments, getMatchCount } from '$lib/utils/search';

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
  let detailsEl: HTMLDetailsElement;
  let expanded = $state(false);

  $effect(() => {
    function handleClick(e: MouseEvent) {
      if (detailsEl && !detailsEl.contains(e.target as Node)) {
        detailsEl.removeAttribute('open');
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  const searchActive = $derived(searchTerms.length > 0);

  const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
  const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
  const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));

  const compactText = $derived(
    searchActive
      ? createExcerpt(card.content, searchTerms)
      : (() => {
          const stripped = card.content.replace(/\[\[IMAGE:\d+\]\]\n?/g, '');
          return stripped.length > 350 ? stripped.slice(0, 350).trimEnd() + '\u2026' : stripped;
        })(),
  );
  const contentSegments = $derived(getHighlightSegments(compactText, searchTerms));

  const matchCount = $derived(
    searchActive
      ? getMatchCount(
          [card.title, card.author, card.book, card.page ?? '', card.content].join(' '),
          searchTerms,
        )
      : 0,
  );

  const visibleTags = $derived(card.tags?.filter((tag) => tag.trim().length > 0) ?? []);

  type ContentPart = { kind: 'text'; text: string } | { kind: 'image'; image: CardImage };
  const expandedParts = $derived.by<ContentPart[]>(() => {
    const imageMap = new Map(card.images.map((img) => [img.placeholder_id, img]));
    const chunks = card.content.split(/\[\[IMAGE:(\d+)\]\]/g);
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

  async function copyCitation() {
    detailsEl?.removeAttribute('open');
    const copied = await copyTextToClipboard(buildCardCitationAPA(card));
    showToast(copied ? 'Cita copiada' : 'No se pudo copiar', copied ? 'success' : 'error');
  }

  async function copyCardText() {
    detailsEl?.removeAttribute('open');
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
        <span class="badge badge-ghost badge-sm text-xs opacity-50">
          p. <HighlightedText segments={pageSegments} />
        </span>
        <a
          href="/cards/{card.id}"
          class="btn btn-ghost btn-xs btn-square"
          title="Ver tarjeta"
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
              <HighlightedText segments={getHighlightSegments(part.text, searchTerms)} />
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
    {:else}
      <p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
        <HighlightedText segments={contentSegments} />
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
          onclick={() => onopenrelations?.(card.id)}
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
        <details bind:this={detailsEl} class="dropdown dropdown-end">
          <summary class="btn btn-xs md:btn-sm btn-ghost">
            <span aria-hidden="true">⋯</span>
            <span class="hidden md:inline">Opciones</span>
          </summary>
          <ul
            class="menu dropdown-content z-20 mt-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow"
          >
            <li>
              <a
                href={`/cards/${card.id}`}
                target="_blank"
                rel="noopener noreferrer"
                data-sveltekit-reload
                onclick={() => detailsEl?.removeAttribute('open')}
              >
                Abrir en nueva pestana
              </a>
            </li>
            <li>
              <button type="button" onclick={copyCitation}>Copiar cita</button>
            </li>
            <li>
              <button type="button" onclick={copyCardText}>Copiar texto</button>
            </li>
          </ul>
        </details>
      </div>
    </div>
  </div>
</article>
