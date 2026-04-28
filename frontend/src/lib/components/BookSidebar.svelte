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

<aside class="lg:sticky lg:top-28 lg:self-start xl:top-24">
	<div class="relative rounded-box border border-base-300 bg-base-100">
		<div class="border-b border-base-200 px-4 py-3">
			<p class="menu-title p-0">Libros</p>
		</div>
		<div class="max-h-[60vh] overflow-y-auto lg:max-h-[calc(100vh-15rem)] xl:max-h-[calc(100vh-14rem)]">
			<ul class="menu menu-sm p-2">
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
				{#if books.length === 0}
					<li class="px-4 py-2 text-xs opacity-60">No hay libros disponibles.</li>
				{/if}
			</ul>
		</div>
		<div class="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-linear-to-t from-base-100 to-transparent"></div>
	</div>
</aside>
