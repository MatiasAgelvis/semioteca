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

<section class="">
	<div class="">
		<h2 class="">{title}</h2>
		{#if description}
			<p class="">{description}</p>
		{/if}
	</div>
	{@render children()}
</section>
