export interface ComposerItem {
  cardId: string;
  order: number;
}

export interface ComposerDocument {
  version: 1;
  title: string;
  subtitle?: string;
  compiler?: string;
  intro?: string;
  items: ComposerItem[];
}

export const CARD_LIMIT = 50;

export function createEmptyDocument(): ComposerDocument {
  return {
    version: 1,
    title: '',
    items: [],
  };
}
