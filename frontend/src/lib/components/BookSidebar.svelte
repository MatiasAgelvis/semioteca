<script lang="ts">
	type Book = { key: string; author: string; title: string; count: number };

	let {
		books,
		selectedBook,
		totalCards,
		onselect
	}: {
		books: Book[];
		selectedBook: string;
		totalCards: number;
		onselect: (key: string) => void;
	} = $props();
</script>

<aside class="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
	<ul class="menu menu-sm bg-base-100 border border-base-300 rounded-box">
		<li class="menu-title">Libros</li>
		<li>
			<button
				type="button"
				class={selectedBook === 'all' ? 'active' : ''}
				onclick={() => onselect('all')}
			>
				<span class="grow font-semibold">Todos los libros</span>
				<span class="badge badge-sm">{totalCards}</span>
			</button>
		</li>
		{#each books as book}
			<li>
				<button
					type="button"
					class={selectedBook === book.key ? 'active' : ''}
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
