<script lang="ts">
	import { clearToast, toast } from '$lib/stores/toast';
</script>

{#if $toast}
	<div class="pointer-events-none fixed right-4 bottom-4 z-100">
		<div class="toast toast-end toast-bottom">
			<div
				class={`alert pointer-events-auto py-2 px-3 text-xs shadow-lg ${$toast.type === 'success' ? 'alert-success' : $toast.type === 'error' ? 'alert-error' : 'alert-info'}`}
				role="status"
				aria-live="polite"
			>
				<span>{$toast.text}</span>
				<button
					type="button"
					class="btn btn-ghost btn-xs"
					onclick={clearToast}
					aria-label="Cerrar notificacion"
				>
					✕
				</button>
			</div>
		</div>
	</div>
{/if}
