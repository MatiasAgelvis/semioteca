<script lang="ts">
	let {
		title,
		description = '',
		children
	}: {
		title: string;
		description?: string;
		children: any;
	} = $props();
</script>

<section>
	<div class="mb-6">
		<h2 class="text-2xl font-black tracking-tight">{title}</h2>
		{#if description}
			<p class="mt-1 text-sm opacity-70">{description}</p>
		{/if}
	</div>
	{@render children()}
</section>
