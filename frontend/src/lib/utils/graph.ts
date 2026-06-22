import type { CardRelationEntry, CardRecord, CardsDataset } from '$lib/types/content';
import type { GraphData, GraphLink, GraphNode } from '$lib/types/graph';

/**
 * Builds a lookup map: card ID → CardRecord.
 */
export function buildCardMap(dataset: CardsDataset): Map<string, CardRecord> {
  const map = new Map<string, CardRecord>();
  for (const book of dataset.books) {
    for (const card of book.cards) {
      map.set(card.id, card);
    }
  }
  return map;
}

/**
 * Builds the graph for a given origin card up to the specified depth.
 * Uses BFS to traverse relations from card-relations.json.
 */
export function buildGraph(
  originId: string,
  depth: number,
  relations: Record<string, CardRelationEntry[]>,
  cardMap: Map<string, CardRecord>,
): GraphData {
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: originId, level: 0 }];
  visited.add(originId);

  const links: GraphLink[] = [];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const entries = relations[id];
    if (!entries?.length || level >= depth) continue;

    for (const entry of entries) {
      links.push({ source: id, target: entry.id, score: entry.score });
      if (!visited.has(entry.id)) {
        visited.add(entry.id);
        queue.push({ id: entry.id, level: level + 1 });
      }
    }
  }

  const nodes: GraphNode[] = Array.from(visited).map((id) => {
    const card = cardMap.get(id);
    return {
      id,
      author: card?.author ?? '',
      book: card?.book ?? '',
      year: card?.year ?? '',
      page: card?.page ?? null,
      degree: 0,
      isOrigin: id === originId,
      x: 0,
      y: 0,
      fx: id === originId ? 0 : null,
      fy: id === originId ? 0 : null,
    };
  });

  // Compute degree within the loaded subgraph
  for (const link of links) {
    const source = nodes.find((n) => n.id === link.source);
    const target = nodes.find((n) => n.id === link.target);
    if (source) source.degree++;
    if (target) target.degree++;
  }

  return { nodes, links };
}

/**
 * Returns author-color scale entries for legend rendering.
 * Uses a fixed palette cycling by author sort order.
 */
export function buildAuthorColors(nodes: GraphNode[]): Map<string, string> {
  const authors = [...new Set(nodes.map((n) => n.author))].sort();
  const colors = new Map<string, string>();
  const palette = [
    '#6366f1',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#f97316',
    '#84cc16',
    '#3b82f6',
  ];
  authors.forEach((a, i) => colors.set(a, palette[i % palette.length]));
  return colors;
}

/**
 * Computes layout metadata for a node: radius, color, opacity.
 */
export function nodeStyle(node: GraphNode, authorColors: Map<string, string>) {
  const r = Math.max(6, 6 + Math.min(node.degree * 3, 18));
  return {
    r,
    fill: authorColors.get(node.author) ?? '#888',
    opacity: node.isOrigin ? 1.0 : 0.85,
    stroke: node.isOrigin ? '#fff' : 'transparent',
    strokeWidth: node.isOrigin ? 3 : 0,
  };
}

/**
 * Maps edge score to visual stroke properties.
 */
export function edgeStyle(score: number) {
  return {
    strokeWidth: 0.5 + score * 1.5,
    opacity: 0.15 + score * 0.25,
  };
}
