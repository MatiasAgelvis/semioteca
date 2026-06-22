<script lang="ts">
  import type { GraphNode } from '$lib/types/graph';

  let {
    node,
    position,
  }: {
    node: GraphNode;
    position: { x: number; y: number };
  } = $props();
</script>

<div
  class="pointer-events-none fixed z-50 rounded-lg border border-base-300 bg-base-100 p-2 text-sm shadow-md"
  style="left: {position.x + 12}px; top: {position.y + 12}px"
>
  <p class="font-semibold">
    {node.author} — {node.book}
  </p>
  <p class="text-xs opacity-60">
    {node.year}{node.page ? ` · p. ${node.page}` : ''}
  </p>
</div>
