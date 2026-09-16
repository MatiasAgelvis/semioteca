<script lang="ts">
  import CardHeader from '$lib/components/card/CardHeader.svelte';
  import CardContent from '$lib/components/card/CardContent.svelte';
  import type { CardRecord } from '$lib/types/content';

  let {
    card,
    searchTerms,
    activeTags = [],
    activeAuthors = [],
    onselect,
  }: {
    card: CardRecord;
    searchTerms: string[];
    activeTags?: string[];
    activeAuthors?: string[];
    onselect: (card: CardRecord) => void;
  } = $props();

  const matchedTags = $derived(card.tags.filter((t) => activeTags.includes(t)));
  const authorHighlighted = $derived(
    activeAuthors.some((a) => card.author.toLowerCase().includes(a.toLowerCase())),
  );
</script>

<button
  type="button"
  class="w-full rounded-box border border-base-200 bg-base-100 px-4 py-3 text-left transition hover:border-primary/50 hover:bg-base-200/60"
  onclick={() => onselect(card)}
>
  <div class="contain-layout">
    <div class="flex items-center justify-between gap-2">
      <CardHeader
        author={card.author}
        book={card.book}
        page={card.page}
        variant="compact"
        {searchTerms}
        {authorHighlighted}
      />
    </div>
    <div class="mt-2">
      <CardContent text={card.content} mode="excerpt" excerptLength={90} {searchTerms} />
    </div>
    {#if matchedTags.length > 0}
      <div class="mt-2 flex flex-wrap gap-1">
        {#each matchedTags as tag}
          <span class="badge badge-warning badge-sm text-xs">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
</button>
