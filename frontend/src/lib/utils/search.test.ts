import { describe, expect, it } from 'vitest';
import {
  tokenizeQuery,
  getMatchCount,
  matchesAllTerms,
  matchesAnyTerm,
  countMatchedTerms,
  getHighlightSegments,
  createExcerpt,
} from './search';

describe('tokenizeQuery', () => {
  it('splits on whitespace', () => {
    expect(tokenizeQuery('hello world')).toEqual(['hello', 'world']);
  });

  it('splits on punctuation', () => {
    expect(tokenizeQuery('eco, semiotica; interpretacion')).toEqual([
      'eco',
      'semiotica',
      'interpretacion',
    ]);
  });

  it('folds accents', () => {
    expect(tokenizeQuery('semiótica')).toEqual(['semiotica']);
  });

  it('deduplicates terms', () => {
    expect(tokenizeQuery('eco eco ECO')).toEqual(['eco']);
  });

  it('filters empty strings', () => {
    expect(tokenizeQuery('  , ; .  ')).toEqual([]);
  });

  it('handles empty input', () => {
    expect(tokenizeQuery('')).toEqual([]);
  });
});

describe('getMatchCount', () => {
  it('returns 0 for empty terms', () => {
    expect(getMatchCount('hello', [])).toBe(0);
  });

  it('counts occurrences of a term', () => {
    expect(getMatchCount('eco eco eco', ['eco'])).toBe(3);
  });

  it('is accent-insensitive', () => {
    expect(getMatchCount('semiótica', ['semiotica'])).toBe(1);
  });

  it('counts across multiple terms', () => {
    expect(getMatchCount('eco semiotica eco', ['eco', 'semiotica'])).toBe(3);
  });

  it('does not count overlapping matches', () => {
    // "aaa" with term "aa" — indexOf-based, so only 1 match (positions 0-1), then starts at 2
    expect(getMatchCount('aaa', ['aa'])).toBe(1);
  });
});

describe('matchesAllTerms', () => {
  it('returns true for empty terms', () => {
    expect(matchesAllTerms('anything', [])).toBe(true);
  });

  it('returns true when all terms present', () => {
    expect(matchesAllTerms('eco semiotica', ['eco', 'semiotica'])).toBe(true);
  });

  it('returns false when one term missing', () => {
    expect(matchesAllTerms('eco semiotica', ['eco', 'psicologia'])).toBe(false);
  });

  it('is accent-insensitive', () => {
    expect(matchesAllTerms('semiótica', ['semiotica'])).toBe(true);
  });
});

describe('matchesAnyTerm', () => {
  it('returns false for empty terms', () => {
    expect(matchesAnyTerm('anything', [])).toBe(false);
  });

  it('returns true when one term present', () => {
    expect(matchesAnyTerm('eco semiotica', ['psicologia', 'eco'])).toBe(true);
  });

  it('returns false when no terms present', () => {
    expect(matchesAnyTerm('eco semiotica', ['psicologia', 'filosofia'])).toBe(false);
  });
});

describe('countMatchedTerms', () => {
  it('returns 0 for empty terms', () => {
    expect(countMatchedTerms('hello', [])).toBe(0);
  });

  it('counts distinct terms found', () => {
    expect(
      countMatchedTerms('eco semiotica interpretacion', ['eco', 'semiotica', 'psicologia']),
    ).toBe(2);
  });
});

describe('getHighlightSegments', () => {
  it('returns single unhighlighted segment for no terms', () => {
    expect(getHighlightSegments('hello', [])).toEqual([{ text: 'hello', match: false }]);
  });

  it('highlights a match', () => {
    const result = getHighlightSegments('hello world', ['world']);
    expect(result).toEqual([
      { text: 'hello ', match: false },
      { text: 'world', match: true },
    ]);
  });

  it('handles match at start', () => {
    const result = getHighlightSegments('hello world', ['hello']);
    expect(result).toEqual([
      { text: 'hello', match: true },
      { text: ' world', match: false },
    ]);
  });

  it('is accent-insensitive', () => {
    const result = getHighlightSegments('semiótica es', ['semiotica']);
    expect(result).toEqual([
      { text: 'semiótica', match: true },
      { text: ' es', match: false },
    ]);
  });

  it('handles multiple matches', () => {
    const result = getHighlightSegments('eco y eco', ['eco']);
    expect(result).toEqual([
      { text: 'eco', match: true },
      { text: ' y ', match: false },
      { text: 'eco', match: true },
    ]);
  });

  it('merges overlapping ranges', () => {
    const result = getHighlightSegments('abcdef', ['abc', 'cde']);
    expect(result).toEqual([
      { text: 'abcde', match: true },
      { text: 'f', match: false },
    ]);
  });

  it('handles empty text', () => {
    expect(getHighlightSegments('', ['eco'])).toEqual([{ text: '', match: false }]);
  });
});

describe('createExcerpt', () => {
  const longText = 'The quick brown fox jumps over the lazy dog and runs away into the forest';

  it('returns empty string for empty text', () => {
    expect(createExcerpt('', ['fox'])).toBe('');
  });

  it('returns full text when no terms', () => {
    expect(createExcerpt('short', [])).toBe('short');
  });

  it('returns full text when no match found', () => {
    expect(createExcerpt('hello world', ['nonexistent'])).toBe('hello world');
  });

  it('extracts around a match with ellipsis', () => {
    const result = createExcerpt(longText, ['fox'], 20);
    expect(result).toContain('fox');
    // Match is at index 16, radius 20 → start=0, so no leading ellipsis
    expect(result.endsWith('…')).toBe(true);
  });

  it('snaps to word boundaries', () => {
    const result = createExcerpt(longText, ['fox'], 10);
    // Should not cut mid-word at the edges
    const withoutEllipsis = result.replace(/^…|…$/g, '');
    const firstWord = withoutEllipsis.split(' ')[0];
    const lastWord = withoutEllipsis.split(' ').pop();
    expect(longText).toContain(firstWord);
    expect(longText).toContain(lastWord);
  });
});
