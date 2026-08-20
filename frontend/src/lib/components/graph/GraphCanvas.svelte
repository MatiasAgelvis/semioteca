<script lang="ts">
  import { select } from 'd3-selection';
  import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
  import { forceSimulation, forceLink, forceManyBody, forceCollide } from 'd3-force';
  import type { GraphData, GraphNode } from '$lib/types/graph';
  import { nodeStyle, edgeStyle } from '$lib/utils/graph';

  let {
    graphData,
    authorColors,
    selectedNodeId = null,
    onnavigate,
    onhover,
    onselect,
  }: {
    graphData: GraphData;
    authorColors: Map<string, string>;
    selectedNodeId?: string | null;
    onnavigate: (cardId: string) => void;
    onhover: (node: GraphNode | null, pos?: { x: number; y: number }) => void;
    onselect: (node: GraphNode | null) => void;
  } = $props();

  let svgEl: SVGSVGElement;
  let zoomTransform = $state('translate(0,0) scale(1)');
  let viewBox = $state('-500 -500 1000 1000');
  let zoomBehavior: ReturnType<typeof d3Zoom<SVGSVGElement, unknown>> | null = null;

  // Local reactive copy — one assignment after simulation settles
  let layoutNodes = $state<GraphNode[]>([]);

  // O(1) node lookups when rendering edges, instead of a linear .find() per edge.
  const nodeById = $derived(new Map(layoutNodes.map((n) => [n.id, n])));

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let hoveredNode: GraphNode | null = null;
  let mousePos = { x: 0, y: 0 };

  function handleNodeEnter(node: GraphNode, e: MouseEvent) {
    mousePos = { x: e.clientX, y: e.clientY };
    // Switching to a different node: drop the previous node's tooltip instead of
    // leaving it stale at its old position while the new hover delay runs.
    if (hoverTimer === null && hoveredNode && hoveredNode !== node) {
      onhover(null);
    }
    hoveredNode = node;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoverTimer = null;
      onhover(node, mousePos);
    }, 300);
  }

  function handleNodeLeave() {
    hoveredNode = null;
    if (hoverTimer) clearTimeout(hoverTimer);
    onhover(null);
  }

  // Track the cursor so the delayed tooltip appears where the mouse actually is
  // at fire time, and keep it glued to the cursor while a node is hovered.
  function handleSvgMousemove(e: MouseEvent) {
    mousePos = { x: e.clientX, y: e.clientY };
    if (hoverTimer === null && hoveredNode) {
      onhover(hoveredNode, mousePos);
    }
  }

  function selectOrNavigate(node: GraphNode) {
    if (selectedNodeId === node.id) {
      // Clicking the same node twice → navigate to full card
      onnavigate(node.id);
    } else {
      onselect(node);
    }
  }

  function handleNodeClick(node: GraphNode, e: MouseEvent) {
    e.stopPropagation();
    selectOrNavigate(node);
  }

  function handleNodeKeydown(node: GraphNode, e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.stopPropagation();
      selectOrNavigate(node);
    } else if (e.key === 'Escape') {
      onselect(null);
    }
  }

  // Run force simulation off-screen, then snap to final positions.
  // CSS transitions on <g transform> animate the snap.
  $effect(() => {
    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const links = graphData.links.map((l) => ({ ...l }));

    const d3Links = links.map((l) => ({
      source: nodes.find((n) => n.id === l.source) ?? l.source,
      target: nodes.find((n) => n.id === l.target) ?? l.target,
      score: l.score,
    }));

    for (const n of nodes) {
      if (n.isOrigin) {
        n.fx = 0;
        n.fy = 0;
      }
    }

    const sim = forceSimulation(nodes as any)
      .force(
        'link',
        forceLink(d3Links)
          .id((d: any) => d.id)
          .distance((l: any) => 100 + (1 - (l.score ?? 0)) * 200)
          .strength((l: any) => 0.2 + (l.score ?? 0) * 0.5),
      )
      .force('charge', forceManyBody().strength(-300))
      .force(
        'collide',
        forceCollide().radius((d: any) => {
          const style = nodeStyle(d as GraphNode, authorColors);
          return style.r + 4;
        }),
      )
      .alphaDecay(0.02)
      .velocityDecay(0.3)
      .stop();

    // Run to completion synchronously
    const maxTicks = 300;
    for (let i = 0; i < maxTicks && sim.alpha() > sim.alphaMin(); i++) {
      sim.tick();
    }

    // Single assignment triggers CSS transitions
    layoutNodes = nodes.map((n) => ({ ...n }));

    // Fit the viewBox to the settled layout so the graph always fills the
    // viewport, regardless of how wide the force simulation spread the nodes.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const r = nodeStyle(n, authorColors).r;
      minX = Math.min(minX, n.x - r);
      maxX = Math.max(maxX, n.x + r);
      minY = Math.min(minY, n.y - r);
      maxY = Math.max(maxY, n.y + r);
    }
    const PADDING = 80;
    const MIN_SPAN = 300; // keep tiny layouts (e.g. single node) from zooming in too far
    const spanX = Math.max(maxX - minX, MIN_SPAN) + PADDING * 2;
    const spanY = Math.max(maxY - minY, MIN_SPAN) + PADDING * 2;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    viewBox = `${cx - spanX / 2} ${cy - spanY / 2} ${spanX} ${spanY}`;

    // Reset zoom to the fitted view (keeps d3's internal transform in sync)
    zoomTransform = 'translate(0,0) scale(1)';
    if (svgEl && zoomBehavior) {
      select(svgEl).call(zoomBehavior.transform, zoomIdentity);
    }
  });

  // Attach zoom behavior
  $effect(() => {
    if (!svgEl) return;

    zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5])
      .on('zoom', (event) => {
        zoomTransform = event.transform.toString();
      });

    select(svgEl).call(zoomBehavior);

    return () => {
      select(svgEl).on('.zoom', null);
    };
  });

  function handleSvgKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onselect(null);
  }

  function handleDblClick() {
    recenter();
  }

  export function recenter() {
    zoomTransform = 'translate(0,0) scale(1)';
    if (svgEl && zoomBehavior) {
      select(svgEl).call(zoomBehavior.transform, zoomIdentity);
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<svg
  bind:this={svgEl}
  class="h-full w-full cursor-grab active:cursor-grabbing"
  {viewBox}
  preserveAspectRatio="xMidYMid meet"
  role="application"
  ondblclick={handleDblClick}
  onkeydown={handleSvgKeydown}
  onmousemove={handleSvgMousemove}
>
  <g transform={zoomTransform}>
    <!-- edges -->
    {#each graphData.links as link}
      {@const style = edgeStyle(link.score)}
      {@const source = nodeById.get(link.source)}
      {@const target = nodeById.get(link.target)}
      {#if source && target}
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke="currentColor"
          stroke-width={style.strokeWidth}
          opacity={style.opacity}
          class="text-base-content transition-all duration-500 ease-out"
        />
      {/if}
    {/each}

    <!-- nodes -->
    {#each layoutNodes as node (node.id)}
      {@const style = nodeStyle(node, authorColors)}
      {@const isSelected = selectedNodeId === node.id}
      <g
        transform="translate({node.x}, {node.y})"
        class="cursor-pointer transition-transform duration-500 ease-out"
        role="button"
        tabindex="0"
        onclick={(e) => handleNodeClick(node, e)}
        onmouseenter={(e) => handleNodeEnter(node, e)}
        onmouseleave={handleNodeLeave}
        onkeydown={(e) => handleNodeKeydown(node, e)}
      >
        {#if isSelected}
          <circle
            cx="0"
            cy="0"
            r={style.r + 6}
            fill="none"
            stroke={style.fill}
            stroke-width="2.5"
            opacity="0.6"
            class="animate-pulse"
          />
        {/if}
        <circle
          cx="0"
          cy="0"
          r={style.r}
          fill={style.fill}
          opacity={style.opacity}
          stroke={style.stroke}
          stroke-width={style.strokeWidth}
        />
        {#if node.isOrigin}
          <text
            x="0"
            y={-style.r - 8}
            text-anchor="middle"
            class="fill-base-content text-xs font-semibold"
            style="paint-order: stroke; stroke: var(--color-base-200); stroke-width: 3px; stroke-linejoin: round;"
          >
            {node.author} — {node.book}
          </text>
        {/if}
      </g>
    {/each}
  </g>
</svg>
