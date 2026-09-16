<script lang="ts">
  import CardTooltip from '$lib/components/card/CardTooltip.svelte';
  import type { GraphNode } from '$lib/types/graph';

  let {
    node,
    position,
  }: {
    node: GraphNode;
    position: { x: number; y: number };
  } = $props();
</script>

<CardTooltip
  author={node.author}
  book={node.book}
  year={node.year}
  page={node.page}
  contentPreview={node.contentPreview}
  {position}
/>
