<script lang="ts">
  import CardImage from '$lib/components/CardImage.svelte';
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import { getHighlightSegments, createExcerpt } from '$lib/utils/search';
  import { stripHtml, sanitizeHtml } from '$lib/utils/html';
  import type { CardImage as CardImageType } from '$lib/types/content';

  let {
    text,
    images = [],
    mode = 'excerpt',
    excerptLength = 350,
    searchTerms = [],
  }: {
    text: string;
    images?: CardImageType[];
    mode?: 'excerpt' | 'full' | 'html';
    excerptLength?: number;
    searchTerms?: string[];
  } = $props();

  // Image map for placeholder resolution
  const imageMap = $derived(new Map(images.map((img) => [img.placeholder_id, img])));

  // Split content into text chunks and image placeholders
  const chunks = $derived(text.split(/\[\[IMAGE:(\d+)\]\]/g));

  // For excerpt mode: plain text, truncated
  const excerptText = $derived(
    (() => {
      const plain = stripHtml(text)
        .replace(/\[\[IMAGE:\d+\]\]\n?/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');
      if (searchTerms.length > 0) {
        return createExcerpt(plain, searchTerms, excerptLength);
      }
      return plain.length > excerptLength
        ? plain.slice(0, excerptLength).trimEnd() + '\u2026'
        : plain;
    })(),
  );

  const excerptSegments = $derived(getHighlightSegments(excerptText, searchTerms));
</script>

{#if mode === 'excerpt'}
  <p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
    {#if searchTerms.length > 0}
      <HighlightedText segments={excerptSegments} />
    {:else}
      {excerptText}
    {/if}
  </p>
{:else if mode === 'html'}
  <p class="whitespace-pre-wrap text-sm leading-relaxed opacity-80">
    {@html sanitizeHtml(text)}
  </p>
{:else if mode === 'full'}
  {#each chunks as chunk, i}
    {#if i % 2 === 0}
      {#if chunk.trim()}
        <p class="whitespace-pre-wrap text-sm leading-7 opacity-80">
          {#if searchTerms.length > 0}
            <HighlightedText segments={getHighlightSegments(stripHtml(chunk), searchTerms)} />
          {:else}
            {@html sanitizeHtml(chunk)}
          {/if}
        </p>
      {/if}
    {:else}
      {@const img = imageMap.get(Number(chunk))}
      {#if img}
        <CardImage image={img} />
      {/if}
    {/if}
  {/each}
{/if}
