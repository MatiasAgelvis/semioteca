<script lang="ts">
  import { goto } from '$app/navigation';
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
        <a
          href="/cards/{rel.id}"
          class="block rounded-xl border border-base-200 bg-base-100 p-4 transition-colors hover:border-primary/40 hover:bg-base-200/50"
          onclick={onselect
            ? (e: MouseEvent) => {
                e.preventDefault();
                onselect(rel.id);
              }
            : undefined}
        >
          <div class="min-w-0">
            <p class="truncate font-semibold">
              {rel.author} — {rel.book}
            </p>
            <p class="mt-1 text-sm opacity-60">
              {rel.author} ({rel.year}){rel.page ? ` · p. ${rel.page}` : ''}
            </p>
          </div>
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
          Explorar conexiones en grafo →  ({relations.length} tarjetas)
        </button>
      </div>
    {/if}
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
