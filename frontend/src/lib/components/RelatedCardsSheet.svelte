<script lang="ts">
  import { goto } from '$app/navigation';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import { TAG_DESCRIPTIONS } from '$lib/constants';
  import type { RelatedCard } from '$lib/types/content';

  let {
    relations,
    show = false,
    onclose,
    onselect,
    currentCardId = '',
  }: {
    relations: RelatedCard[];
    show: boolean;
    onclose: () => void;
    onselect?: (cardId: string) => void;
    currentCardId?: string;
  } = $props();

  let dialogEl: HTMLDialogElement;

  $effect(() => {
    if (show) {
      if (dialogEl && !dialogEl.open) dialogEl.showModal();
    } else {
      if (dialogEl && dialogEl.open) dialogEl.close();
    }
  });

  function handleClose() {
    onclose();
  }

  function visibleTags(tags: string[]) {
    return tags.filter((t) => t.trim().length > 0);
  }
</script>

<dialog bind:this={dialogEl} class="modal" onclose={handleClose}>
  <div class="modal-box max-w-2xl max-h-[calc(100vh-4rem)] !overflow-hidden flex flex-col !p-0">
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b border-base-200 px-6 py-4">
      <h2 class="text-lg font-bold">Tarjetas relacionadas</h2>
      <button class="btn btn-ghost btn-sm" type="button" aria-label="Cerrar" onclick={handleClose}>
        ✕
      </button>
    </div>

    <!-- Scrollable body with fade -->
    <div
      class="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4"
      style="mask-image: linear-gradient(to bottom, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 92%, transparent 100%)"
    >
      {#each relations as rel (rel.id)}
        {@const tags = visibleTags(rel.tags)}
        <a
          href="/cards/{rel.id}"
          class="block rounded-xl border border-base-200 bg-base-100 p-4 transition-colors hover:border-primary/30 hover:bg-base-200/50"
          onclick={onselect
            ? (e: MouseEvent) => {
                e.preventDefault();
                onselect(rel.id);
              }
            : undefined}
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-sm">
                {rel.author} — {rel.book}
              </p>
              <p class="mt-0.5 text-xs opacity-50">
                {rel.author} ({rel.year}){rel.page ? ` · p. ${rel.page}` : ''}
              </p>
            </div>
          </div>

          {#if tags.length > 0}
            <div class="mt-2 flex flex-wrap gap-1">
              {#each tags as tag}
                <div
                  class="tooltip tooltip-top before:whitespace-normal before:max-w-50"
                  data-tip={TAG_DESCRIPTIONS[tag] ?? 'Sin descripción'}
                >
                  <button
                    type="button"
                    class="badge badge-outline badge-xs text-[9px] uppercase tracking-wider opacity-50 hover:badge-primary hover:opacity-80 cursor-pointer"
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCardsSearch([tag]);
                    }}
                  >
                    {tag}
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          {#if rel.contentPreview}
            <p class="mt-2 line-clamp-2 text-xs leading-relaxed opacity-60">
              {rel.contentPreview}
            </p>
          {/if}
        </a>
      {/each}

      {#if relations.length === 0}
        <p class="py-8 text-center text-sm opacity-50">
          No hay tarjetas relacionadas para mostrar.
        </p>
      {/if}
    </div>

    <!-- Fixed footer — always visible, no fade -->
    {#if currentCardId}
      <div class="shrink-0 border-t border-base-200 px-6 py-4">
        <button
          class="btn btn-soft w-full"
          onclick={() => {
            onclose();
            goto(`/cards/graph?origin=${currentCardId}`);
          }}
        >
          Explorar conexiones en red →  ({relations.length} tarjetas)
        </button>
      </div>
    {/if}
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
