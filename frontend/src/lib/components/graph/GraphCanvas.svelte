<script lang="ts">
  import { select } from 'd3-selection';
  import { zoom as d3Zoom } from 'd3-zoom';
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

  // Local reactive copy — one assignment after simulation settles
  let layoutNodes = $state<GraphNode[]>([]);

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  function handleNodeEnter(node: GraphNode, e: MouseEvent) {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      onhover(node, { x: e.clientX, y: e.clientY });
    }, 300);
  }

  function handleNodeLeave() {
    if (hoverTimer) clearTimeout(hoverTimer);
    onhover(null);
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

  function handleSvgClick(e: MouseEvent) {
    // Only deselect if clicking directly on the SVG background, not a node
    if (e.target === svgEl || (e.target as Element).tagName === 'svg') {
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
  });

  // Attach zoom behavior
  $effect(() => {
    if (!svgEl) return;

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5])
      .on('zoom', (event) => {
        zoomTransform = event.transform.toString();
      });

    select(svgEl).call(zoomBehavior);

    return () => {
      select(svgEl).on('.zoom', null);
    };
  });

  function handleDblClick() {
    recenter();
  }

  export function recenter() {
    zoomTransform = 'translate(0,0) scale(1)';
  }
</script>

<svg
  bind:this={svgEl}
  class="h-full w-full"
  viewBox="-500 -500 1000 1000"
  preserveAspectRatio="xMidYMid meet"
  role="application"
  ondblclick={handleDblClick}
  onclick={handleSvgClick}
  onkeydown={(e) => {
    if (e.key === 'Escape') onselect(null);
  }}
>
  <g transform={zoomTransform}>
    <!-- edges -->
    {#each graphData.links as link}
      {@const style = edgeStyle(link.score)}
      {@const source = layoutNodes.find((n) => n.id === link.source)}
      {@const target = layoutNodes.find((n) => n.id === link.target)}
      {#if source && target}
        <line
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke="currentColor"
          stroke-width={style.strokeWidth}
          opacity={style.opacity}
          class="text-base-content/30 transition-all duration-500 ease-out"
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
          >
            {node.author} — {node.book}
          </text>
        {/if}
      </g>
    {/each}
  </g>
</svg>
