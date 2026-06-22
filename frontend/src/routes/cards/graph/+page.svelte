<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import GraphCanvas from '$lib/components/graph/GraphCanvas.svelte';
  import GraphLegend from '$lib/components/graph/GraphLegend.svelte';
  import GraphToolbar from '$lib/components/graph/GraphToolbar.svelte';
  import GraphTooltip from '$lib/components/graph/GraphTooltip.svelte';
  import type { CardsDataset } from '$lib/types/content';
  import type { GraphData, GraphNode, GraphDepth } from '$lib/types/graph';
  import { buildCardMap, buildGraph, buildAuthorColors } from '$lib/utils/graph';

  let loading = $state(true);
  let error = $state<string | null>(null);
  let graphData = $state<GraphData>({ nodes: [], links: [] });
  let authorColors = $state<Map<string, string>>(new Map());
  let legendOpen = $state(false);
  let hoveredNode = $state<GraphNode | null>(null);
  let tooltipPos = $state({ x: 0, y: 0 });

  const origin = $derived($page.url.searchParams.get('origin') ?? '');
  const depth = $derived(
    (Number($page.url.searchParams.get('depth')) || 1) as GraphDepth,
  );

  onMount(async () => {
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
      const relations = await relationsRes.json();
      const cardMap = buildCardMap(dataset);

      if (!origin || !cardMap.has(origin)) {
        error = 'Tarjeta no encontrada.';
        loading = false;
        return;
      }

      const data = buildGraph(origin, depth, relations, cardMap);
      graphData = data;
      authorColors = buildAuthorColors(data.nodes);
    } catch (e) {
      error = 'Error al cargar los datos.';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  function handleDepthChange(d: GraphDepth) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('depth', String(d));
    goto(`/cards/graph?${params.toString()}`, { replaceState: true });
  }

  function handleRefocus(cardId: string) {
    const params = new URLSearchParams();
    params.set('origin', cardId);
    params.set('depth', '1');
    goto(`/cards/graph?${params.toString()}`);
  }

  function handleHover(
    node: GraphNode | null,
    pos?: { x: number; y: number },
  ) {
    hoveredNode = node;
    if (pos) tooltipPos = pos;
  }
</script>

<svelte:head>
  <title>{origin ? `Grafo de relaciones` : 'Grafo'} | Significado Total</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 lg:px-10" style="min-height: calc(100dvh - 12rem)">
  {#if loading}
    <div class="flex flex-1 items-center justify-center">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-lg opacity-70">{error}</p>
      <a class="btn btn-outline" href="/cards">← Volver al repositorio</a>
    </div>
  {:else if graphData.nodes.length === 0}
    <div class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-lg opacity-70">
        Esta tarjeta no tiene relaciones para visualizar.
      </p>
      <a class="btn btn-outline" href="/cards/{origin}">← Volver a la tarjeta</a>
    </div>
  {:else}
    <GraphToolbar
      {depth}
      origin={origin}
      legendOpen={legendOpen}
      onDepthChange={handleDepthChange}
      onLegendToggle={() => (legendOpen = !legendOpen)}
    />

    <div class="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-200/50">
      <GraphCanvas
        graphData={graphData}
        authorColors={authorColors}
        onrefocus={handleRefocus}
        onhover={handleHover}
      />
      {#if hoveredNode}
        <GraphTooltip node={hoveredNode} position={tooltipPos} />
      {/if}
      {#if legendOpen}
        <GraphLegend
          authorColors={authorColors}
          onclose={() => (legendOpen = false)}
        />
      {/if}
    </div>
  {/if}
</div>
