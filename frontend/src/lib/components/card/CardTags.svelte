<script lang="ts">
  import Tag from '$lib/components/Tag.svelte';
  import { TAG_DESCRIPTIONS } from '$lib/constants';

  let {
    tags = [],
    maxVisible = 3,
    variant = 'static',
    onTagClick,
  }: {
    tags?: string[];
    maxVisible?: number;
    variant?: 'static' | 'outline' | 'interactive';
    onTagClick?: (tag: string) => void;
  } = $props();

  const visibleTags = $derived(tags.filter((t) => t.trim().length > 0).slice(0, maxVisible));
  const extraCount = $derived(
    Math.max(0, tags.filter((t) => t.trim().length > 0).length - maxVisible),
  );
</script>

{#if visibleTags.length > 0}
  <div class="flex flex-wrap gap-1">
    {#each visibleTags as tag}
      {#if variant === 'interactive'}
        <div
          class="tooltip tooltip-top before:whitespace-normal before:max-w-50"
          data-tip={TAG_DESCRIPTIONS[tag] ?? 'Sin descripción'}
        >
          <Tag {tag} onclick={() => onTagClick?.(tag)} />
        </div>
      {:else}
        <Tag {tag} {variant} onclick={() => onTagClick?.(tag)} />
      {/if}
    {/each}
    {#if extraCount > 0}
      <span class="text-[10px] font-semibold opacity-60 truncate">
        +{extraCount}
      </span>
    {/if}
  </div>
{/if}
