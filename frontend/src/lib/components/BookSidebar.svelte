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
	<ul class="menu menu-sm p-0 w-auto">
		{#each books as book}
			<li>
				<button
					type="button"
					class="flex items-stretch p-0 overflow-hidden {selectedBook === book.key ? 'menu-active' : ''}"
					onclick={() => onselect(book.key)}
				>
					<span class="flex min-w-0 flex-1 flex-col px-3 py-2 text-left">
						<span class="block truncate font-semibold">{book.author}</span>
						<span class="block text-xs opacity-70">{book.title}</span>
					</span>
					<span class="flex items-center justify-center border-l border-base-content/5 bg-base-content/5 px-2">
						<span class="font-mono text-[10px] font-bold tracking-tighter opacity-50">
							{book.count}
						</span>
					</span>
				</button>
			</li>
		{/each}
		{#if books.length === 0}
			<li class="px-4 py-2 text-xs opacity-60">No hay libros disponibles.</li>
		{/if}
	</ul>
</SidebarContainer>

