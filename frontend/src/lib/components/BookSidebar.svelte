<script lang="ts">
  import SidebarContainer from './SidebarContainer.svelte';
  type Book = { key: string; author: string; title: string; year: string };

  let {
    books,
    selectedBook,
    onselect,
  }: {
    books: Book[];
    selectedBook: string;
    onselect: (key: string) => void;
  } = $props();
</script>

<SidebarContainer title="Libros">
  <ul class="menu menu-sm p-0 w-full min-w-0">
    {#each books as book}
      <li class="min-w-0">
        <button
          type="button"
          class={`flex items-stretch p-0 overflow-hidden w-full text-left ${selectedBook === book.key ? 'menu-active' : ''}`}
          onclick={() => onselect(book.key)}
        >
          <span class="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2 text-sm">
            <span class="flex items-baseline gap-2 min-w-0">
              <span class="truncate min-w-0 font-semibold">{book.author}</span>
              <span class="text-xs opacity-50 tabular-nums shrink-0">{book.year}</span>
            </span>
            <span class="truncate block min-w-0 text-xs opacity-70">{book.title}</span>
          </span>
        </button>
      </li>
    {/each}
    {#if books.length === 0}
      <li class="px-4 py-2 text-xs opacity-50">No hay libros disponibles.</li>
    {/if}
  </ul>
</SidebarContainer>
