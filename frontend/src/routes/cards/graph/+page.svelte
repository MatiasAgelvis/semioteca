<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
  import GraphLegend from '$lib/components/graph/GraphLegend.svelte';
  import GraphToolbar from '$lib/components/graph/GraphToolbar.svelte';
  import GraphTooltip from '$lib/components/graph/GraphTooltip.svelte';
  import GraphPanel from '$lib/components/graph/GraphPanel.svelte';
  import type { CardRelationEntry, CardsDataset, CardRecord } from '$lib/types/content';
  import { GRAPH_DEPTHS, type GraphData, type GraphNode, type GraphDepth } from '$lib/types/graph';
  import { buildCardMap, buildGraph, buildAuthorColors } from '$lib/utils/graph';

  let loading = $state(true);
  let error = $state<string | null>(null);
  let pickCardHint = $state(false);
  let graphData = $state<GraphData>({ nodes: [], links: [] });
  let authorColors = $state<Map<string, string>>(new Map());
  let legendOpen = $state(false);
  let hoveredNode = $state<GraphNode | null>(null);
  let tooltipPos = $state({ x: 0, y: 0 });
  let selectedNode = $state<GraphNode | null>(null);

  // Cached data — fetched once
  let cachedRelations = $state<Record<string, CardRelationEntry[]> | null>(null);
  let cardMap = $state<Map<string, CardRecord>>(new Map());
  let graphCanvas = $state<ReturnType<typeof GraphCanvas> | undefined>();

  // Parse initial values from URL
  const origin = $derived($page.url.searchParams.get('origin') ?? '');

  // Clamp the URL depth param to the valid depth range (1–3); anything else
  // (absent, 0, negative, out-of-range, fractional) defaults to 1.
  function clampDepth(value: number): GraphDepth {
    return (GRAPH_DEPTHS as readonly number[]).includes(value) ? (value as GraphDepth) : 1;
  }
  const initialDepth = $derived(clampDepth(Number($page.url.searchParams.get('depth') ?? '')));

  // Local depth state — mutable, synced to URL without navigation
  let depth = $state<GraphDepth>(1);

  onMount(async () => {
    // No card chosen: guide the user to the repo without fetching any data.
    if (!origin) {
      pickCardHint = true;
      error = 'Elige una tarjeta para explorar su red de relaciones.';
      loading = false;
      return;
    }

    try {
      const [cardsRes, relationsRes] = await Promise.all([
        fetch('/content/cards.json'),
        fetch('/content/card-relations.json'),
      ]);

      if (!cardsRes.ok || !relationsRes.ok) {
        error = 'No se pudieron cargar los datos.';
        loading = false;
        return;
      }

      const dataset = (await cardsRes.json()) as CardsDataset;
      cachedRelations = await relationsRes.json();
      cardMap = buildCardMap(dataset);

      if (!cardMap.has(origin)) {
        error = 'Tarjeta no encontrada.';
        loading = false;
        return;
      }

      // Set depth from URL on initial load
      depth = initialDepth;

      // If the URL carried an out-of-range depth, rewrite it to the clamped value
      const rawDepth = $page.url.searchParams.get('depth');
      if (rawDepth !== null && rawDepth !== String(depth)) {
        const url = new URL($page.url);
        url.searchParams.set('depth', String(depth));
        history.replaceState(history.state, '', url.toString());
      }
    } catch (e) {
      error = 'Error al cargar los datos.';
      console.error(e);
    }
  });

  // Rebuild graph whenever depth or origin changes
  $effect(() => {
    if (!cachedRelations || !origin || !cardMap.has(origin)) return;
    const data = buildGraph(origin, depth, cachedRelations, cardMap);
    graphData = data;
    authorColors = buildAuthorColors(data.nodes);
    loading = false;
  });

  function handleDepthChange(d: GraphDepth) {
    depth = d;
    // Sync URL without triggering navigation
    const url = new URL($page.url);
    url.searchParams.set('depth', String(d));
    history.replaceState(history.state, '', url.toString());
  }

  function handleNavigate(cardId: string) {
    goto(`/cards/${cardId}?from=graph&origin=${encodeURIComponent(origin)}`);
  }

  function handleSelect(node: GraphNode | null) {
    selectedNode = node;
    hoveredNode = null;
  }

  function handleHover(node: GraphNode | null, pos?: { x: number; y: number }) {
    hoveredNode = node;
    if (pos) tooltipPos = pos;
  }
</script>

<svelte:head>
  <title>{origin ? `Red de relaciones` : 'Red'} | Significado Total</title>
</svelte:head>

<div
  class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 transition-[padding] duration-300 ease-out lg:px-10"
  class:lg:pr-[28rem]={selectedNode !== null}
  style="height: max(24rem, calc(100dvh - var(--header-height, 7rem) - 8rem))"
>
  {#if loading}
    <div class="flex flex-1 items-center justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p class="text-lg opacity-70">{error}</p>
      {#if pickCardHint}
        <a class="btn btn-outline" href="/cards">Explorar el repositorio y elegir una tarjeta</a>
      {:else}
        <a class="btn btn-outline" href="/cards">← Volver al repositorio</a>
      {/if}
    </div>
  {:else if graphData.nodes.length === 0}
    <div class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-lg opacity-70">Esta tarjeta no tiene relaciones para visualizar.</p>
      <a class="btn btn-outline" href="/cards/{origin}">← Volver a la tarjeta</a>
    </div>
  {:else}
    <GraphToolbar
      {depth}
      {origin}
      {legendOpen}
      onDepthChange={handleDepthChange}
      onLegendToggle={() => (legendOpen = !legendOpen)}
      onRecenter={() => graphCanvas?.recenter()}
    />

    <div
      class="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-200/50"
      onwheel={(e) => e.preventDefault()}
    >
      <GraphCanvas
        bind:this={graphCanvas}
        {graphData}
        {authorColors}
        selectedNodeId={selectedNode?.id ?? null}
        onnavigate={handleNavigate}
        onhover={handleHover}
        onselect={handleSelect}
      />
      {#if hoveredNode && !selectedNode}
        <GraphTooltip node={hoveredNode} position={tooltipPos} />
      {/if}
      {#if legendOpen}
        <GraphLegend {authorColors} onclose={() => (legendOpen = false)} />
      {/if}

      <div
        class="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-base-200/80 px-2.5 py-1 text-[11px] text-base-content/40"
      >
        Rueda para zoom · Arrastra para mover
      </div>
    </div>

    <GraphPanel node={selectedNode} {origin} onclose={() => (selectedNode = null)} />
  {/if}
</div>
