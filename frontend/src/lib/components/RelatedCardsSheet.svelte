<script lang="ts">
  import { goto } from '$app/navigation';
  import { openCardsSearch } from '$lib/stores/cardsSearch';
  import type { RelatedCard } from '$lib/types/content';
  import CloseIcon from '$lib/components/CloseIcon.svelte';
  import { VectorPolygon } from '@lucide/svelte';
  import CardHeader from '$lib/components/card/CardHeader.svelte';
  import CardTags from '$lib/components/card/CardTags.svelte';

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
</script>

<dialog bind:this={dialogEl} class="modal" onclose={handleClose}>
  <div class="modal-box max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden! flex flex-col p-0!">
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b border-base-200 px-6 py-4">
      <h2 class="text-lg font-bold flex items-center gap-2">
        Tarjetas relacionadas
        <span class="badge badge-ghost badge-sm text-xs opacity-50 flex items-center gap-1">
          <VectorPolygon size="1em" />
          {relations.length}
        </span>
      </h2>
      <button class="btn btn-ghost btn-sm" type="button" aria-label="Cerrar" onclick={handleClose}>
        <CloseIcon />
      </button>
    </div>

    <!-- Scrollable body with fade -->
    <div
      class="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4"
      style="mask-image: linear-gradient(to bottom, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 92%, transparent 100%)"
    >
      {#if currentCardId}
        <button
          class="btn btn-primary btn-md w-full gap-2"
          onclick={() => {
            onclose();
            goto(`/cards/graph?origin=${currentCardId}`);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg
          >
          Explorar en red
        </button>
      {/if}

      {#each relations as rel (rel.id)}
        <a
          href="/cards/{rel.id}"
          class="block rounded-box border border-base-200 bg-base-100 p-4 transition-colors hover:border-primary/30 hover:bg-base-200/50"
          onclick={onselect
            ? (e: MouseEvent) => {
                e.preventDefault();
                onselect(rel.id);
              }
            : undefined}
        >
          <div class="flex items-center gap-2">
            <CardHeader author={rel.author} book={rel.book} page={rel.page} variant="mini" />
          </div>

          {#if rel.tags.length > 0}
            <div class="mt-2">
              <CardTags tags={rel.tags} variant="static" />
            </div>
          {/if}

          {#if rel.contentPreview}
            <p class="mt-2 line-clamp-2 text-xs leading-relaxed opacity-60">
              {@html rel.contentPreview}
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
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
