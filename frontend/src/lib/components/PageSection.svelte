<script lang="ts">
	let {
		title,
		description = '',
		headingLevel = 'h2',
		children
	}: {
		title: string;
		description?: string;
		headingLevel?: 'h1' | 'h2' | 'h3';
		children: any;
	} = $props();
</script>

<section>
	<div class="mb-6">
		<svelte:element this={headingLevel} class="text-2xl font-black tracking-tight">{title}</svelte:element>
		{#if description}
			<p class="mt-1 text-sm opacity-70">{description}</p>
		{/if}
	</div>
	{@render children()}
</section>
