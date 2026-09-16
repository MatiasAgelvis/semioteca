<script lang="ts">
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import CardBadge from './CardBadge.svelte';
  import { getHighlightSegments } from '$lib/utils/search';

  let {
    author,
    book,
    year,
    page,
    variant = 'compact',
    showArrow = false,
    onNavigate,
    searchTerms = [],
    matchCount,
    authorHighlighted = false,
  }: {
    author: string;
    book: string;
    year?: string;
    page?: string | null;
    variant?: 'compact' | 'full' | 'mini';
    showArrow?: boolean;
    onNavigate?: () => void;
    searchTerms?: string[];
    matchCount?: number;
    authorHighlighted?: boolean;
  } = $props();

  const authorSegments = $derived(getHighlightSegments(author, searchTerms));
  const bookSegments = $derived(getHighlightSegments(book, searchTerms));
  const pageSegments = $derived(getHighlightSegments(page ?? 's/p', searchTerms));
</script>

{#if variant === 'compact'}
  <div class="flex items-center gap-2">
    <p class="font-bold min-w-0 truncate">
      {#if authorHighlighted}
        <mark class="rounded bg-highlight/40 px-0.5">{author}</mark>
      {:else}
        <HighlightedText segments={authorSegments} />
      {/if}
      <span> &mdash; </span>
      <HighlightedText segments={bookSegments} />
    </p>
    {#if showArrow}
      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square shrink-0"
        onclick={onNavigate}
        title="Ver tarjeta"
      >
        &rarr;
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-2 shrink-0 ml-auto">
    {#if matchCount !== undefined}
      <CardBadge variant="match">{matchCount} coinc.</CardBadge>
    {/if}
    {#if page}
      <CardBadge variant="page">p. <HighlightedText segments={pageSegments} /></CardBadge>
    {/if}
  </div>
{:else if variant === 'full'}
  <p class="min-w-0 flex-1 text-xl font-bold truncate">
    <HighlightedText segments={authorSegments} />
    <span> &mdash; </span>
    <HighlightedText segments={bookSegments} />
    {#if year}
      <span class="font-normal opacity-70"> ({year})</span>
    {/if}
  </p>
  {#if page}
    <CardBadge variant="page">p. {page}</CardBadge>
  {/if}
{:else if variant === 'mini'}
  <p class="truncate font-semibold text-sm min-w-0 flex-1">
    <HighlightedText segments={authorSegments} />
    <span> &mdash; </span>
    <HighlightedText segments={bookSegments} />
  </p>
  {#if page}
    <CardBadge variant="page">p. {page}</CardBadge>
  {/if}
{/if}
