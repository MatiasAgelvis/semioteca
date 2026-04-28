<script lang="ts">
	import type { HighlightSegment } from '$lib/utils/search';

	let {
		segments,
		className = '',
		matchClass = 'rounded bg-warning/30 px-0.5'
	}: {
		segments: HighlightSegment[];
		className?: string;
		matchClass?: string;
	} = $props();
</script>

<span class={className}>
	{#each segments as segment, index (index)}
		{#if segment.match}
			<mark class={matchClass}>{segment.text}</mark>
		{:else}
			{segment.text}
		{/if}
	{/each}
</span>