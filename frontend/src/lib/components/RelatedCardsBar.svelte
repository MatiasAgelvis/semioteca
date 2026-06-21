<script lang="ts">
    let { count, onopen }: { count: number; onopen: () => void } = $props();
</script>

{#if count > 0}
    <div class="sticky bottom-0 z-20">
        <button
            class="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-base-300 bg-base-100/90 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-base-200/80"
            type="button"
            onclick={onopen}
        >
            {count}
            {count === 1 ? "tarjeta relacionada" : "tarjetas relacionadas"}
        </button>
    </div>
{/if}
