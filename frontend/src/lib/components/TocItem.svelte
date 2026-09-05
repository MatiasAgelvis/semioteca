<script lang="ts">
  import HighlightedText from '$lib/components/HighlightedText.svelte';
  import type { CardRecord } from '$lib/types/content';
  import { getHighlightSegments } from '$lib/utils/search';

  let {
    card,
    index,
    total,
    focused,
    searchTerms = [],
    onscrollto,
  }: {
    card: CardRecord;
    index: number;
    total: number;
    focused: boolean;
    searchTerms?: string[];
    onscrollto: (id: string) => void;
  } = $props();

  const pageSegments = $derived(getHighlightSegments(card.page ?? 's/p', searchTerms));
</script>

<button
  type="button"
  class="flex min-w-0 items-center justify-between gap-2 w-full px-3 py-2 text-sm text-left {focused
    ? 'menu-active'
    : ''}"
  onclick={() => onscrollto(card.id)}
>
  <span class="flex items-baseline gap-2 shrink min-w-0">
    <span class="opacity-60 text-xs tabular-nums shrink-0 font-semibold">{index}.</span>
    <span class="min-w-0 truncate font-semibold">
      <HighlightedText segments={pageSegments} />
    </span>
  </span>
  {#if card.tags.length > 0}
    <span class="text-[10px] opacity-40 shrink-0 truncate">
      {card.tags.slice(0, 3).join(' · ')}
      {#if card.tags.length > 3}
        +{card.tags.length - 3}
      {/if}
    </span>
  {/if}
</button>
