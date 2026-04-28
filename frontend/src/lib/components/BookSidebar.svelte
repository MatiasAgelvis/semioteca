<script lang="ts">
	type Book = { key: string; author: string; title: string; count: number };

	let {
		books,
		selectedBook,
		onselect
	}: {
		books: Book[];
		selectedBook: string;
		onselect: (key: string) => void;
	} = $props();
</script>

<aside class="lg:sticky lg:top-28 lg:h-[calc(100vh-9rem)] lg:overflow-y-auto xl:top-24 xl:h-[calc(100vh-8rem)]">
	<ul class="menu menu-sm bg-base-100 border border-base-300 rounded-box">
		<li class="menu-title">Libros</li>
		{#each books as book}
			<li>
				<button
					type="button"
					class={selectedBook === book.key ? 'menu-active' : ''}
					onclick={() => onselect(book.key)}
				>
					<span class="grow">
						<span class="block font-semibold">{book.author}</span>
						<span class="block text-xs opacity-60">{book.title}</span>
					</span>
					<span class="badge badge-sm">{book.count}</span>
				</button>
			</li>
		{/each}
	</ul>
</aside>
