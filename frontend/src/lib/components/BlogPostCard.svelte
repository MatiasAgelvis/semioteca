<script lang="ts">
	interface Props {
		post: {
			slug: string;
			title: string;
			coverImage?: string | null;
			excerpt?: string | null;
		};
		variant?: 'landing' | 'list';
	}

	let { post, variant = 'list' }: Props = $props();
</script>

<a
	href={`/blog/${post.slug}`}
	class="group flex flex-col rounded-2xl border border-base-300/70 p-5 transition hover:border-primary/30 hover:shadow-lg {variant ===
	'landing'
		? 'bg-base-100/80'
		: 'bg-base-100/90 shadow-md shadow-base-content/5'}"
>
	{#if post.coverImage}
		<img
			src={post.coverImage}
			alt={post.title}
			class="mb-4 w-full rounded-xl object-cover transition group-hover:opacity-90 dark:group-hover:opacity-80 {variant ===
			'landing'
				? 'h-36'
				: 'h-44'}"
		/>
	{/if}

	<h2
		class="font-black text-base-content transition group-hover:text-primary line-clamp-2 {variant ===
		'landing'
			? 'min-h-12 text-base'
			: 'min-h-14 text-xl'}"
	>
		{post.title}
	</h2>

	{#if post.excerpt}
		<p
			class="mt-3 text-sm leading-7 line-clamp-3 {variant === 'landing'
				? 'text-base-content/60'
				: 'text-base-content/70'}"
		>
			{post.excerpt}
		</p>
	{/if}

	{#if variant === 'list'}
		<div class="mt-auto pt-5">
			<span class="btn btn-outline group-hover:btn-primary w-full md:w-auto">Leer artículo</span>
		</div>
	{/if}
</a>
