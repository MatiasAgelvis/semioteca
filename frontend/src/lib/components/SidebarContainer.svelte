<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children,
		footer
	}: {
		title: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<aside class="lg:sticky lg:top-28 lg:self-start xl:top-24 w-full">
	<div class="relative rounded-box border border-base-300 bg-base-100 overflow-hidden flex flex-col">
		<div class="border-b border-base-200 px-4 py-3 shrink-0 bg-base-100/50 backdrop-blur-xs">
			<p class="text-xs font-bold uppercase tracking-widest opacity-50">{title}</p>
		</div>
		<div class="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-15rem)] xl:max-h-[calc(100vh-14rem)]">
			<div class="p-2">
				{@render children()}
			</div>
		</div>
		{#if footer}
			<div class="border-t border-base-200 p-2 shrink-0 bg-base-50/50">
				{@render footer()}
			</div>
		{/if}
		<div class="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-linear-to-t from-base-100 to-transparent"></div>
	</div>
</aside>
