<script lang="ts">
  let {
    author,
    book,
    year,
    page,
    contentPreview,
    position,
  }: {
    author: string;
    book: string;
    year?: string;
    page?: string | null;
    contentPreview: string;
    position: { x: number; y: number };
  } = $props();
</script>

<div
  class="pointer-events-none fixed z-50 max-w-xs rounded-box border border-base-300 bg-base-100 p-3 text-sm shadow-md"
  style="left: {position.x + 12}px; top: {position.y + 12}px"
>
  <p class="font-semibold">
    {author} &mdash; {book}
  </p>
  <p class="text-xs opacity-60">
    {year}{page ? ` · p. ${page}` : ''}
  </p>
  {#if contentPreview}
    <p class="mt-1.5 line-clamp-3 text-xs leading-relaxed opacity-70">
      {contentPreview}
    </p>
  {/if}
</div>
