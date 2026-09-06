<script lang="ts">
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import type { CardRecord } from '$lib/types/content';
  import { getHighlightSegments } from '$lib/utils/search';

  let {
    card,
    focused,
    searchTerms = [],
    onscrollto,
  }: {
    card: CardRecord;
    focused: boolean;
    searchTerms?: string[];
    onscrollto: (id: string) => void;
  } = $props();

  const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));
  const authorSegments = $derived(getHighlightSegments(card.author, searchTerms));
  const bookSegments = $derived(getHighlightSegments(card.book, searchTerms));
</script>

<button
  type="button"
  class="flex min-w-0 items-center gap-2 w-full px-3 py-2 text-sm text-left {focused
    ? 'menu-active'
    : ''}"
  onclick={() => onscrollto(card.id)}
>
  <span class="flex min-w-0 flex-1 flex-col">
    <span class="flex items-baseline gap-2 min-w-0">
      <span class="truncate min-w-0 font-semibold">
        <HighlightedText segments={authorSegments} />
      </span>
      <span class="badge badge-ghost badge-xs tabular-nums shrink-0 font-semibold"
        >p. <HighlightedText segments={pageSegments} /></span
      >
    </span>
    <span class="truncate block min-w-0 text-xs opacity-70">
      <HighlightedText segments={bookSegments} />
    </span>
  </span>
</button>
