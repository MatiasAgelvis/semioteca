<script lang="ts">
    import type { RelatedCard } from "$lib/types/content";

    let {
        relations,
        show = false,
        onclose,
        onselect,
    }: {
        relations: RelatedCard[];
        show: boolean;
        onclose: () => void;
        onselect?: (cardId: string) => void;
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

    function scorePercent(score: number): string {
        return `${Math.round(score * 100)}%`;
    }
</script>

<dialog bind:this={dialogEl} class="modal" onclose={handleClose}>
    <div
        class="modal-box max-w-2xl max-h-[calc(100vh-4rem)] !overflow-hidden flex flex-col !p-0"
    >
        <!-- Header — doesn't scroll -->
        <div
            class="flex shrink-0 items-center justify-between border-b border-base-200 px-6 py-4"
        >
            <h2 class="text-lg font-bold">Tarjetas relacionadas</h2>
            <button
                class="btn btn-ghost btn-sm"
                type="button"
                aria-label="Cerrar"
                onclick={handleClose}
            >
                ✕
            </button>
        </div>

        <!-- Body — scrolls with fade edges -->
        <div
            class="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-4"
            style="mask-image: linear-gradient(to bottom, black 92%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 92%, transparent 100%)"
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
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <p class="truncate font-semibold">
                                {rel.author} — {rel.book}
                            </p>
                            <p class="mt-1 text-sm opacity-60">
                                {rel.author} ({rel.year}){rel.page
                                    ? ` · p. ${rel.page}`
                                    : ""}
                            </p>
                        </div>
                        <span
                            class="shrink-0 font-mono text-xs tabular-nums opacity-50"
                            >{scorePercent(rel.score)}</span
                        >
                    </div>
                    <!-- Score bar -->
                    <div
                        class="mt-2 h-1 w-full overflow-hidden rounded-full bg-base-200"
                    >
                        <div
                            class="h-full rounded-full bg-primary/40 transition-all"
                            style="width: {scorePercent(rel.score)}"
                        ></div>
                    </div>
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
