<script lang="ts">
  import { dismissToast, toasts } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';
  import CloseIcon from '$lib/components/CloseIcon.svelte';
</script>

<div class="pointer-events-none fixed right-4 bottom-4 z-100">
  <div class="toast toast-end toast-bottom">
    {#each $toasts as toast (toast.id)}
      <div
        transition:fly={{ x: 100, duration: 400 }}
        class={`alert alert-soft pointer-events-auto py-2 px-3 text-xs shadow-lg ${toast.type === 'success' ? 'alert-success' : toast.type === 'error' ? 'alert-error' : 'alert-info'}`}
        role="status"
        aria-live="polite"
      >
        <span>{toast.text}</span>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          onclick={() => dismissToast(toast.id)}
          aria-label="Cerrar notificacion"
        >
          <CloseIcon />
        </button>
      </div>
    {/each}
  </div>
</div>
