import { describe, expect, it } from 'vitest';
import { normalizeBookPart, getBookKey } from './books';

describe('normalizeBookPart', () => {
  it('lowercases', () => {
    expect(normalizeBookPart('ECO')).toBe('eco');
    expect(normalizeBookPart('Eco')).toBe('eco');
  });

  it('strips accents', () => {
    expect(normalizeBookPart('Interpretación')).toBe('interpretacion');
    expect(normalizeBookPart('Señales')).toBe('senales');
  });

  it('normalizes whitespace', () => {
    expect(normalizeBookPart('  hello   world  ')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(normalizeBookPart('')).toBe('');
  });

  it('combines all transforms', () => {
    expect(normalizeBookPart('  Los Límites  de la Interpretación  ')).toBe(
      'los limites de la interpretacion',
    );
  });
});

describe('getBookKey', () => {
  it('concatenates normalized author and book', () => {
    expect(getBookKey({ author: 'Eco', book: 'Los límites de la interpretación' })).toBe(
      'eco-los limites de la interpretacion',
    );
  });

  it('handles empty fields', () => {
    expect(getBookKey({ author: '', book: '' })).toBe('-');
  });

  it('is case-insensitive', () => {
    expect(getBookKey({ author: 'ECO', book: 'LOS LIMITES' })).toBe(
      getBookKey({ author: 'eco', book: 'los limites' }),
    );
  });
});
