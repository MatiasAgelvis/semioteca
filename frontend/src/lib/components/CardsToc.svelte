<script lang="ts">
  import SidebarContainer from './SidebarContainer.svelte';
  import TocItem from './TocItem.svelte';
  import TocItemFull from './TocItemFull.svelte';
  import type { CardRecord } from '$lib/types/content';

  let {
    cards,
    focusedCardId,
    searchTerms = [],
    /** When true, show only page numbers (single-book context). When false, show author + book + page (cross-book search). */
    compact = false,
    onscrollto,
  }: {
    cards: CardRecord[];
    focusedCardId: string | null;
    searchTerms?: string[];
    compact?: boolean;
    onscrollto: (id: string) => void;
  } = $props();
</script>

<SidebarContainer title="Contenido">
  <ul class="menu menu-sm p-0 w-full min-w-0">
    {#each cards as card, i (card.id)}
      <li class="w-full">
        {#if compact}
          <TocItem
            {card}
            index={i + 1}
            total={cards.length}
            focused={focusedCardId === card.id}
            {searchTerms}
            {onscrollto}
          />
        {:else}
          <TocItemFull {card} focused={focusedCardId === card.id} {searchTerms} {onscrollto} />
        {/if}
      </li>
    {/each}
    {#if cards.length === 0}
      <li class="text-xs opacity-50 px-4 py-2">Sin resultados para mostrar.</li>
    {/if}
  </ul>
</SidebarContainer>
