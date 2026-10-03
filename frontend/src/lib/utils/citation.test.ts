import { describe, expect, it } from 'vitest';
import { buildCardCitationAPA, buildCardFullText } from './citation';
import type { CardRecord } from '$lib/types/content';

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'test-id',
    author: 'Eco',
    book: 'Los límites de la interpretación',
    year: '1992',
    page: '9-10',
    raw_marker: 'ECO, U. (1992:9-10).',
    content: 'Some <em>content</em> here.',
    source_path: 'test.odt',
    source_format: 'odt',
    tags: [],
    images: [],
    ...overrides,
  } as CardRecord;
}

describe('buildCardCitationAPA', () => {
  it('builds a citation from card fields', () => {
    const result = buildCardCitationAPA(makeCard());
    expect(result).toBe(
      'Eco. (1992). Los límites de la interpretación (p. 9-10). Significado Total.',
    );
  });

  it('uses fallbacks for missing fields', () => {
    const result = buildCardCitationAPA(makeCard({ author: '', year: '', book: '', page: '' }));
    expect(result).toBe('Autor desconocido. (n.d.). Sin titulo (p. s. p.). Significado Total.');
  });
});

describe('buildCardFullText', () => {
  it('builds full text with content', () => {
    const result = buildCardFullText(makeCard());
    expect(result).toContain('Eco.');
    expect(result).toContain('Los límites de la interpretación (1992), p. 9-10.');
    expect(result).toContain('Some content here.');
  });

  it('strips HTML from content', () => {
    const result = buildCardFullText(makeCard({ content: '<strong>bold</strong> text' }));
    expect(result).toContain('bold text');
    expect(result).not.toContain('<strong>');
  });

  it('removes image markers', () => {
    const result = buildCardFullText(makeCard({ content: 'before [[IMAGE:1]] after' }));
    expect(result).toContain('before after');
    expect(result).not.toContain('[[IMAGE:1]]');
  });
});
