import tags from '../data/card-tags.json';

/** Short UI definitions keyed by tag name. Sourced from backend/card-tags.json. */
export const tagDefinitions: Record<string, string> = Object.fromEntries(
  tags.map((t) => [t.name, t.definition]),
);
