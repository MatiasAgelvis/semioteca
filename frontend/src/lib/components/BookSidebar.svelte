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

<aside class="rounded-2xl border border-surface-300/70 bg-surface-50/90 p-4 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
	<p class="text-sm font-semibold tracking-[0.16em] text-surface-600 uppercase">Libros</p>
	<div class="mt-4 space-y-2">
		<button
			type="button"
			class={`w-full rounded-lg px-3 py-2 text-left text-sm ${selectedBook === 'all' ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'}`}
			onclick={() => onselect('all')}
		>
			<span class="font-semibold">Todos los libros</span>
			<span class="block text-xs">{totalCards} tarjetas</span>
		</button>
		{#each books as book}
			<button
				type="button"
				class={`w-full rounded-lg px-3 py-2 text-left text-sm ${selectedBook === book.key ? 'bg-primary-100 text-primary-900' : 'bg-surface-100 text-surface-700'}`}
				onclick={() => onselect(book.key)}
			>
				<span class="font-semibold">{book.author}</span>
				<span class="block text-xs">{book.title} ({book.count})</span>
			</button>
		{/each}
	</div>
</aside>
