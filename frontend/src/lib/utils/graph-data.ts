import type { CardRelationEntry, CardsDataset } from '$lib/types/content';

// The graph JSON payloads are static per build. Parse them once and reuse the
// result across graph-page navigations within the session, so growing payloads
// don't mean re-parsing multi-MB JSON on every card-graph visit.
let cards: CardsDataset | null = null;
let relations: Record<string, CardRelationEntry[]> | null = null;

export interface GraphDataPayload {
  dataset: CardsDataset;
  relations: Record<string, CardRelationEntry[]>;
}

export async function loadGraphData(): Promise<GraphDataPayload | null> {
  if (cards && relations) {
    return { dataset: cards, relations };
  }

  try {
    const [cardsRes, relationsRes] = await Promise.all([
      fetch('/content/cards.json'),
      fetch('/content/card-relations.json'),
    ]);
    if (!cardsRes.ok || !relationsRes.ok) return null;

    cards = (await cardsRes.json()) as CardsDataset;
    relations = (await relationsRes.json()) as Record<string, CardRelationEntry[]>;
    return { dataset: cards, relations };
  } catch {
    return null;
  }
}
