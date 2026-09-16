<script lang="ts">
  import type { CardImage as CardImageType } from '$lib/types/content';

  let { image }: { image: CardImageType } = $props();

  function imageUrl(image: CardImageType): string {
    const idx = image.path.indexOf('cards_images/');
    return idx !== -1 ? `/content/${image.path.slice(idx)}` : '';
  }
</script>

<figure class="my-2 overflow-hidden rounded-box bg-base-300/50 p-2">
  <div>
    <img
      src={imageUrl(image)}
      alt={image.alt_text ?? image.caption ?? ''}
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      class="w-full max-h-96 object-contain rounded"
    />
  </div>
  {#if image.caption}
    <figcaption class="mt-1 text-xs opacity-50">
      {image.caption}
    </figcaption>
  {/if}
</figure>
