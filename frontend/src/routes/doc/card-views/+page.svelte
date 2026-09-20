<script lang="ts">
  import SearchResultItem from '$lib/components/SearchResultItem.svelte';
  import CardItem from '$lib/components/CardItem.svelte';
  import Tag from '$lib/components/Tag.svelte';
  import {
    CardHeader,
    CardContent,
    CardTags,
    CardActions,
    CardBadge,
    CardTooltip,
  } from '$lib/components/card';
  import type { CardRecord } from '$lib/types/content';
  import type { RelatedCard } from '$lib/types/content';
  import type { GraphNode } from '$lib/types/graph';

  // ── Mock data ──────────────────────────────────────────────────────────

  const mockCard: CardRecord = {
    title: 'Los límites de la interpretación',
    author: 'Eco',
    book: 'Los límites de la interpretación',
    year: '1992',
    id: 'eco-1992-los-l-mites-de-la-interpretaci-n-2',
    page: '9-10',
    raw_marker: 'ECO, U. (1992:9-10).',
    content:
      'Después de esto, habiendo sido enviado de nuevo con una Carga igual, y con una Carta que expresaba el <strong>Número preciso</strong> de Higos que habían de ser entregados, devoró otra vez, según su anterior Práctica, gran Parte de ellos por el Camino; pero antes de tocarlos, (para prevenir toda posible acusación) cogió la Carta, y la escondió debajo de una Piedra.\n\nSeguramente esta página de Wilkins suena diferente de otras páginas de nuestro tiempo donde la escritura se toma como ejemplo supremo de <em>semiosis</em>.',
    source_path: 'ODT/Eco 1992 Los límites de la interpretación.odt',
    source_format: 'odt',
    images: [],
    tags: ['semiótica', 'interpretación', 'Eco'],
  };

  const mockCardLongPage: CardRecord = {
    ...mockCard,
    id: mockCard.id + '-long',
    page: '5 y ss del capítulo Cerebros en una cubeta',
    title: 'Análisis y metafísica',
    author: 'Strawson',
    book: 'Análisis y metafísica',
    year: '1997',
    tags: ['filosofía de la mente'],
  };

  const mockGraphNode: GraphNode = {
    id: mockCard.id,
    author: mockCard.author,
    book: mockCard.book,
    year: mockCard.year,
    page: mockCard.page,
    degree: 12,
    isOrigin: true,
    content: mockCard.content.replace(/<[^>]+>/g, ''),
    contentPreview: mockCard.content.replace(/<[^>]+>/g, '').slice(0, 200) + '…',
    tags: mockCard.tags,
    x: 0,
    y: 0,
    fx: 0,
    fy: 0,
  };

  const mockRelated: RelatedCard = {
    id: mockCard.id,
    title: mockCard.title,
    author: mockCard.author,
    book: mockCard.book,
    year: mockCard.year,
    page: mockCard.page,
    score: 0.87,
    contentPreview: mockCard.content.replace(/<[^>]+>/g, '').slice(0, 160) + '…',
    tags: mockCard.tags,
  };

  const mockCards = [mockCard, mockCardLongPage];

  // ── Interaction stubs ──────────────────────────────────────────────────
  function noop() {}
  function logClick(label: string) {
    return () => console.log(`[card-views doc] ${label}`);
  }
</script>

<svelte:head>
  <title>Card Views — Design Reference</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 space-y-16">
  <header>
    <h1 class="text-2xl font-bold">Card Views — Design Reference</h1>
    <p class="mt-2 text-sm opacity-60">
      Every surface where card content appears, grouped by tier. Use this to compare layouts and
      identify inconsistencies.
    </p>
  </header>

  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- COMPARISON TABLE                                                   -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <section>
    <h2 class="text-lg font-bold border-b border-base-300 pb-2">Inconsistencies to resolve</h2>
    <div class="mt-4 overflow-x-auto">
      <table class="table table-sm text-xs">
        <thead>
          <tr>
            <th>Element</th>
            <th>Preview</th>
            <th>Extended</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-semibold">Author format</td>
            <td><code>Author — Book</code></td>
            <td><code>Author (Year) · p.</code></td>
            <td><code>Author — Book (Year)</code></td>
          </tr>
          <tr>
            <td class="font-semibold">Page badge</td>
            <td><code>p. {'{page}'}</code> right</td>
            <td>inline in meta</td>
            <td><code>p. {'{page}'}</code> right</td>
          </tr>
          <tr>
            <td class="font-semibold">Content</td>
            <td>plain text / excerpt</td>
            <td>@html</td>
            <td>@html</td>
          </tr>
          <tr>
            <td class="font-semibold">Tags</td>
            <td>optional (static)</td>
            <td>yes (static)</td>
            <td>yes (outline, clickable)</td>
          </tr>
          <tr>
            <td class="font-semibold">Actions</td>
            <td>none</td>
            <td>Explorar, Añadir</td>
            <td>Red, Añadir, fav, ⋯</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- LAYER 1: PRIMITIVES                                               -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <section>
    <h2 class="text-lg font-bold border-b border-base-300 pb-2">
      Layer 1 &mdash; Primitives
      <span class="text-xs font-normal opacity-50 ml-2">
        Building blocks for all compositions
      </span>
    </h2>

    <!-- CardBadge -->
    <div class="mt-6">
      <h3 class="text-sm font-semibold opacity-70 mb-3">CardBadge</h3>
      <div class="flex flex-wrap items-center gap-3">
        <CardBadge variant="page">p. 42</CardBadge>
        <CardBadge variant="match">3 coinc.</CardBadge>
        <CardBadge variant="score">87%</CardBadge>
      </div>
    </div>

    <!-- CardHeader variants -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-3">CardHeader</h3>
      <div class="space-y-4 max-w-2xl">
        <div>
          <p class="text-xs opacity-50 mb-1">compact (with arrow)</p>
          <div class="flex items-center justify-between gap-2">
            <CardHeader
              author={mockCard.author}
              book={mockCard.book}
              page={mockCard.page}
              variant="compact"
              showArrow
              onNavigate={noop}
            />
          </div>
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">full</p>
          <div class="flex items-start justify-between gap-4">
            <CardHeader
              author={mockCard.author}
              book={mockCard.book}
              year={mockCard.year}
              page={mockCard.page}
              variant="full"
            />
          </div>
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">mini (RelatedCardsSheet row)</p>
          <div class="flex items-center gap-2">
            <CardHeader
              author={mockCard.author}
              book={mockCard.book}
              page={mockCard.page}
              variant="mini"
            />
          </div>
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">compact with long page</p>
          <div class="flex items-center justify-between gap-2">
            <CardHeader
              author={mockCardLongPage.author}
              book={mockCardLongPage.book}
              page={mockCardLongPage.page}
              variant="compact"
              showArrow
              onNavigate={noop}
            />
          </div>
        </div>
      </div>
    </div>

    <!-- CardContent modes -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-3">CardContent</h3>
      <div class="space-y-4 max-w-2xl">
        <div class="border border-base-300 rounded-box p-3">
          <p class="text-xs opacity-50 mb-2">excerpt (90 chars)</p>
          <CardContent text={mockCard.content} mode="excerpt" excerptLength={90} />
        </div>
        <div class="border border-base-300 rounded-box p-3">
          <p class="text-xs opacity-50 mb-2">excerpt (350 chars)</p>
          <CardContent text={mockCard.content} mode="excerpt" excerptLength={350} />
        </div>
        <div class="border border-base-300 rounded-box p-3">
          <p class="text-xs opacity-50 mb-2">html (sanitized)</p>
          <CardContent text={mockCard.content} mode="html" />
        </div>
        <div class="border border-base-300 rounded-box p-3">
          <p class="text-xs opacity-50 mb-2">full (with images if present)</p>
          <CardContent text={mockCard.content} mode="full" images={mockCard.images} />
        </div>
      </div>
    </div>

    <!-- CardTags variants -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-3">CardTags</h3>
      <div class="space-y-3 max-w-2xl">
        <div>
          <p class="text-xs opacity-50 mb-1">static</p>
          <CardTags tags={mockCard.tags} variant="static" />
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">outline</p>
          <CardTags tags={mockCard.tags} variant="outline" />
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">interactive (with tooltips)</p>
          <CardTags tags={mockCard.tags} variant="interactive" onTagClick={logClick('tag')} />
        </div>
      </div>
    </div>

    <!-- CardActions variants -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-3">CardActions</h3>
      <div class="space-y-4 max-w-2xl">
        <div>
          <p class="text-xs opacity-50 mb-1">graph</p>
          <CardActions variant="graph" cardId={mockCard.id} />
        </div>
        <div>
          <p class="text-xs opacity-50 mb-1">full (with slot for left content)</p>
          <CardActions variant="full" cardId={mockCard.id} onOpenRelations={logClick('relations')}>
            {#snippet left()}
              <CardTags tags={mockCard.tags} variant="outline" />
            {/snippet}
          </CardActions>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <!-- LAYER 2: COMPOSITIONS (new primitives assembled)                    -->
  <!-- ═══════════════════════════════════════════════════════════════════ -->
  <section>
    <h2 class="text-lg font-bold border-b border-base-300 pb-2">
      Layer 2 &mdash; Compositions from primitives
      <span class="text-xs font-normal opacity-50 ml-2">
        Every surface rebuilt from building blocks
      </span>
    </h2>

    <p class="mt-2 text-xs opacity-50">
      Each composition is a thin wrapper assembling primitives. No bespoke markup &mdash; just
      layout + which primitives to use.
    </p>

    <!-- 1. SearchResultItem -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        1. SearchResultItem
        <span class="text-xs opacity-50 ml-1">· search dialog</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(compact) + CardContent(excerpt 90)
      </p>
      <div class="max-w-2xl border border-base-300 rounded-box px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <CardHeader
            author={mockCard.author}
            book={mockCard.book}
            page={mockCard.page}
            variant="compact"
          />
        </div>
        <CardContent text={mockCard.content} mode="excerpt" excerptLength={90} />
      </div>
    </div>

    <!-- 2. GraphTooltip -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        2. GraphTooltip
        <span class="text-xs opacity-50 ml-1">· graph hover</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">Primitives: CardTooltip (standalone)</p>
      <CardTooltip
        author={mockCard.author}
        book={mockCard.book}
        year={mockCard.year}
        page={mockCard.page}
        contentPreview={mockCard.content.replace(/<[^>]+>/g, '').slice(0, 200) + '\u2026'}
        position={{ x: 0, y: 0 }}
      />
    </div>

    <!-- 3. RelatedCardsSheet -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        3. RelatedCardsSheet
        <span class="text-xs opacity-50 ml-1">· related cards row</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(mini) + CardTags(static) + CardContent(excerpt 160)
      </p>
      <div class="max-w-2xl border border-base-300 rounded-box divide-y divide-base-300">
        {#each [mockRelated, { ...mockRelated, id: 'other', author: 'Putnam', book: 'Representaci\u00f3n y realidad', year: '1990', page: '68', contentPreview: 'La filosof\u00eda de la mente no es simplemente una filosof\u00eda de los estados mentales. Es tambi\u00e9n una filosof\u00eda del\u2026', tags: ['filosof\u00eda de la mente', 'realismo'] }] as rel}
          <a href="/cards" class="block px-4 py-3 hover:bg-base-200/50 transition">
            <div class="flex items-center gap-2">
              <CardHeader author={rel.author} book={rel.book} page={rel.page} variant="mini" />
            </div>
            <div class="mt-2">
              <CardTags tags={rel.tags} variant="static" />
            </div>
            <p class="mt-2 line-clamp-2 text-xs leading-relaxed opacity-60">
              {rel.contentPreview}
            </p>
          </a>
        {/each}
      </div>
    </div>

    <!-- 4. TOCItem -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        4. TocItem / TocItemFull
        <span class="text-xs opacity-50 ml-1">· sidebar navigation</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardBadge + text (too simple to need full primitives)
      </p>
      <div class="max-w-xs border border-base-300 rounded-box">
        <div class="flex min-w-0 items-center gap-2 px-3 py-2 text-sm">
          <span class="opacity-60 text-xs tabular-nums shrink-0 font-semibold">#1</span>
          <span class="min-w-0 truncate font-semibold">{mockCard.page}</span>
        </div>
        <div class="flex min-w-0 items-center gap-2 px-3 py-2 text-sm menu-active">
          <span class="opacity-60 text-xs tabular-nums shrink-0 font-semibold">#2</span>
          <span class="min-w-0 truncate font-semibold">{mockCardLongPage.page}</span>
        </div>
      </div>
    </div>

    <!-- 5. GraphPanel -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        5. GraphPanel
        <span class="text-xs opacity-50 ml-1">· graph sidepane</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(compact) + CardTags(static) + CardContent(html) + CardActions(graph)
      </p>
      <div class="max-w-md border border-base-300 rounded-box overflow-hidden">
        <div class="border-b border-base-200 px-5 py-3">
          <div class="flex items-center justify-between">
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <p class="truncate text-sm font-semibold">{mockCard.book}</p>
              <button type="button" class="btn btn-ghost btn-xs shrink-0">&rarr;</button>
            </div>
            <button class="btn btn-ghost btn-sm btn-square ml-2 shrink-0">&#x2715;</button>
          </div>
          <p class="truncate text-xs opacity-60">
            {mockCard.author} ({mockCard.year}){mockCard.page ? ` · p. ${mockCard.page}` : ''}
          </p>
          <div class="mt-2"><CardTags tags={mockCard.tags} variant="static" /></div>
        </div>
        <div class="px-5 py-4">
          <div class="rounded-box border border-base-200 bg-base-200/40 p-4">
            <CardContent text={mockCard.content} mode="html" />
          </div>
        </div>
        <div class="border-t border-base-200 px-5 py-3">
          <CardActions variant="graph" cardId={mockCard.id} />
        </div>
      </div>
    </div>

    <!-- 6. CardItem collapsed -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        6. CardItem (collapsed)
        <span class="text-xs opacity-50 ml-1">· books view</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(compact + arrow) + CardContent(excerpt 350) + CardTags(interactive)
      </p>
      <div class="max-w-2xl border border-base-300 rounded-box p-5">
        <div class="flex items-center justify-between gap-2">
          <CardHeader
            author={mockCard.author}
            book={mockCard.book}
            page={mockCard.page}
            variant="compact"
            showArrow
            onNavigate={noop}
          />
        </div>
        <CardContent text={mockCard.content} mode="excerpt" excerptLength={350} />
        <button type="button" class="btn btn-ghost btn-sm w-full mt-2 text-xs opacity-60">
          Mostrar contenido &darr;
        </button>
        <div class="card-actions flex-nowrap items-center justify-between mt-1">
          <CardTags tags={mockCard.tags} variant="interactive" onTagClick={logClick('tag')} />
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="btn btn-xs md:btn-sm btn-ghost">Red</span>
            <span class="btn btn-xs md:btn-sm btn-ghost">A&ntilde;adir</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. CardItem expanded -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        7. CardItem (expanded)
        <span class="text-xs opacity-50 ml-1">· books view</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(compact + arrow) + CardContent(full) + CardTags(interactive) + copy
        links
      </p>
      <div class="max-w-2xl border border-base-300 rounded-box p-5">
        <div class="flex items-center justify-between gap-2">
          <CardHeader
            author={mockCard.author}
            book={mockCard.book}
            page={mockCard.page}
            variant="compact"
            showArrow
            onNavigate={noop}
          />
        </div>
        <div class="mt-1 space-y-3">
          <CardContent text={mockCard.content} mode="full" images={mockCard.images} />
          <p class="text-xs opacity-40">Copiar cita · Copiar texto</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm w-full mt-2 text-xs opacity-60">
          Ocultar contenido &uarr;
        </button>
        <div class="card-actions flex-nowrap items-center justify-between mt-1">
          <CardTags tags={mockCard.tags} variant="interactive" onTagClick={logClick('tag')} />
          <div class="flex flex-wrap items-center justify-end gap-2">
            <span class="btn btn-xs md:btn-sm btn-ghost">Red</span>
            <span class="btn btn-xs md:btn-sm btn-ghost">A&ntilde;adir</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 8. Card Detail page -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        8. Card Detail
        <span class="text-xs opacity-50 ml-1">· /cards/[id]</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(full) + CardContent(full) + CardTags(interactive) + CardActions(full)
      </p>
      <div class="max-w-3xl border border-base-300 rounded-box p-6">
        <div class="flex items-start justify-between gap-4">
          <CardHeader
            author={mockCard.author}
            book={mockCard.book}
            year={mockCard.year}
            page={mockCard.page}
            variant="full"
          />
        </div>
        <div class="mt-7 space-y-4 rounded-box border border-base-200 bg-base-200/40 p-5">
          <CardContent text={mockCard.content} mode="full" images={mockCard.images} />
          <p class="mt-5 text-xs opacity-40">Copiar cita · Copiar texto</p>
        </div>
        <div class="mt-5">
          <CardActions variant="full" cardId={mockCard.id} onOpenRelations={logClick('relations')}>
            {#snippet left()}
              <CardTags tags={mockCard.tags} variant="interactive" onTagClick={logClick('tag')} />
            {/snippet}
          </CardActions>
        </div>
      </div>
    </div>

    <!-- 9. Composer Preview -->
    <div class="mt-8">
      <h3 class="text-sm font-semibold opacity-70 mb-1">
        9. Composer Preview
        <span class="text-xs opacity-50 ml-1">· compose page row</span>
      </h3>
      <p class="text-xs opacity-40 mb-2">
        Primitives: CardHeader(full, inline) + CardContent(excerpt 350)
      </p>
      <div class="max-w-2xl border border-base-300 rounded-box">
        <div class="px-4 py-3">
          <p class="text-sm font-semibold">
            1. {mockCard.author} &mdash; {mockCard.book} ({mockCard.year}), p. {mockCard.page}
          </p>
        </div>
        <div class="px-4 pb-3">
          <p
            class="text-sm leading-relaxed opacity-70 pl-7 border-l-2 border-base-300 ml-2 whitespace-pre-wrap"
          >
            {mockCard.content.replace(/<[^>]+>/g, '').slice(0, 350)}…
          </p>
        </div>
        <div class="border-t border-base-300 px-4 py-3">
          <p class="text-sm font-semibold">
            2. {mockCardLongPage.author} &mdash; {mockCardLongPage.book} ({mockCardLongPage.year}),
            p. {mockCardLongPage.page}
          </p>
        </div>
      </div>
    </div>
  </section>
</div>
