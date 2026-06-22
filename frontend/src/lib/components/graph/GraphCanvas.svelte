<script lang="ts">
  import { select } from 'd3-selection';
  import { zoom as d3Zoom } from 'd3-zoom';
  import { forceSimulation, forceLink, forceManyBody, forceCollide } from 'd3-force';
  import type { GraphData, GraphNode } from '$lib/types/graph';
  import { nodeStyle, edgeStyle } from '$lib/utils/graph';

  let {
    graphData,
    authorColors,
    onnavigate,
    onhover,
  }: {
    graphData: GraphData;
    authorColors: Map<string, string>;
    onnavigate: (cardId: string) => void;
    onhover: (node: GraphNode | null, pos?: { x: number; y: number }) => void;
  } = $props();

  let svgEl: SVGSVGElement;
  let zoomTransform = $state('translate(0,0) scale(1)');

  // Local reactive copy that D3 mutates — decoupled from the prop
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

  function handleNodeClick(node: GraphNode) {
    onnavigate(node.id);
  }

  // Run force simulation off-screen, then snap to final positions
  $effect(() => {
    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const links = graphData.links.map((l) => ({ ...l }));

    // Resolve source/target to actual node objects (required by d3-force)
    const d3Links = links.map((l) => ({
      source: nodes.find((n) => n.id === l.source) ?? l.source,
      target: nodes.find((n) => n.id === l.target) ?? l.target,
      score: l.score,
    }));

    // Pin origin to center
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
      .stop(); // Don't auto-start — run synchronously

    // Run simulation to completion synchronously (sub-50ms for <200 nodes)
    const maxTicks = 300;
    for (let i = 0; i < maxTicks && sim.alpha() > sim.alphaMin(); i++) {
      sim.tick();
    }

    // Snap to final positions in one shot
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
          class="text-base-content/30"
        />
      {/if}
    {/each}

    <!-- nodes -->
    {#each layoutNodes as node (node.id)}
      {@const style = nodeStyle(node, authorColors)}
      <g
        class="cursor-pointer"
        role="button"
        tabindex="0"
        onclick={() => handleNodeClick(node)}
        onmouseenter={(e) => handleNodeEnter(node, e)}
        onmouseleave={handleNodeLeave}
        onkeydown={(e) => {
          if (e.key === 'Enter') handleNodeClick(node);
        }}
      >
        <circle
          cx={node.x}
          cy={node.y}
          r={style.r}
          fill={style.fill}
          opacity={style.opacity}
          stroke={style.stroke}
          stroke-width={style.strokeWidth}
        />
        {#if node.isOrigin}
          <text
            x={node.x}
            y={node.y - style.r - 8}
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
