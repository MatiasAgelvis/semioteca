import { describe, expect, it } from 'vitest';
import { parseSearchUrl, buildSearchParams } from './searchUrl';

describe('parseSearchUrl', () => {
  it('parses q parameter', () => {
    const sp = new URLSearchParams({ q: 'eco' });
    expect(parseSearchUrl(sp)).toEqual({ q: 'eco' });
  });

  it('parses tags parameter', () => {
    const sp = new URLSearchParams({ tags: 'semiotica,filosofia' });
    expect(parseSearchUrl(sp)).toEqual({ tags: ['semiotica', 'filosofia'] });
  });

  it('parses authors parameter with encoding', () => {
    const sp = new URLSearchParams({ authors: encodeURIComponent('Eco') });
    expect(parseSearchUrl(sp)).toEqual({ authors: ['Eco'] });
  });

  it('parses mode parameter', () => {
    expect(parseSearchUrl(new URLSearchParams({ mode: 'any' }))).toEqual({ mode: 'any' });
    expect(parseSearchUrl(new URLSearchParams({ mode: 'all' }))).toEqual({ mode: 'all' });
  });

  it('ignores invalid mode', () => {
    expect(parseSearchUrl(new URLSearchParams({ mode: 'invalid' }))).toEqual({});
  });

  it('parses book parameter', () => {
    const sp = new URLSearchParams({ book: 'eco-some-book' });
    expect(parseSearchUrl(sp)).toEqual({ book: 'eco-some-book' });
  });

  it('returns empty object for empty params', () => {
    expect(parseSearchUrl(new URLSearchParams())).toEqual({});
  });
});

describe('buildSearchParams', () => {
  it('builds q parameter', () => {
    const sp = buildSearchParams({ q: 'eco' });
    expect(sp.get('q')).toBe('eco');
  });

  it('builds tags parameter', () => {
    const sp = buildSearchParams({ tags: ['semiotica', 'filosofia'] });
    expect(sp.get('tags')).toBe('semiotica,filosofia');
  });

  it('builds authors with encoding', () => {
    const sp = buildSearchParams({ authors: ['Eco'] });
    expect(sp.get('authors')).toBe(encodeURIComponent('Eco'));
  });

  it('omits mode=all (default)', () => {
    const sp = buildSearchParams({ mode: 'all' });
    expect(sp.get('mode')).toBeNull();
  });

  it('includes mode=any', () => {
    const sp = buildSearchParams({ mode: 'any' });
    expect(sp.get('mode')).toBe('any');
  });

  it('omits empty arrays', () => {
    const sp = buildSearchParams({ tags: [], authors: [] });
    expect(sp.get('tags')).toBeNull();
    expect(sp.get('authors')).toBeNull();
  });

  it('omits empty q', () => {
    const sp = buildSearchParams({ q: '' });
    expect(sp.get('q')).toBeNull();
  });
});

describe('roundtrip', () => {
  it('parse(build(params)) returns equivalent params', () => {
    const original = {
      q: 'eco semiotica',
      tags: ['interpretacion', 'filosofía de la mente'],
      authors: ['Eco', 'Umberto Eco'],
      mode: 'any' as const,
    };
    const roundtripped = parseSearchUrl(buildSearchParams(original));
    expect(roundtripped.q).toBe(original.q);
    expect(roundtripped.tags).toEqual(original.tags);
    expect(roundtripped.authors).toEqual(original.authors);
    expect(roundtripped.mode).toBe(original.mode);
  });
});
