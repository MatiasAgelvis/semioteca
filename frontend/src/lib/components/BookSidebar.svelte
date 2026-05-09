<script lang="ts">
	import SidebarContainer from './SidebarContainer.svelte';
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

<SidebarContainer title="Libros">
	<ul class="menu menu-sm p-0">
		{#each books as book}
			<li>
				<button
					type="button"
					class={selectedBook === book.key ? 'menu-active' : ''}
					onclick={() => onselect(book.key)}
				>
					<span class="grow">
						<span class="block font-semibold">{book.author}</span>
						<span class="block text-xs opacity-60 line-clamp-1">{book.title}</span>
					</span>
					<span class="badge badge-sm">{book.count}</span>
				</button>
			</li>
		{/each}
		{#if books.length === 0}
			<li class="px-4 py-2 text-xs opacity-60">No hay libros disponibles.</li>
		{/if}
	</ul>
</SidebarContainer>

