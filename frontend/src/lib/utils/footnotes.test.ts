import { describe, expect, it } from 'vitest';
import { linkFootnotes } from './footnotes';

describe('linkFootnotes', () => {
  it('returns html unchanged when footnotes is empty', () => {
    expect(linkFootnotes('<sup>1</sup>', {})).toBe('<sup>1</sup>');
    expect(linkFootnotes('<sup>1</sup>', undefined as never)).toBe('<sup>1</sup>');
  });

  it('links sup tags with matching footnote numbers', () => {
    const result = linkFootnotes('<sup>1</sup>', { '1': 'A note' });
    expect(result).toContain('href="#fn-1"');
    expect(result).toContain('<sup>1</sup>');
  });

  it('leaves sup tags unlinked when number has no footnote', () => {
    const result = linkFootnotes('<sup>99</sup>', { '1': 'A note' });
    expect(result).toBe('<sup>99</sup>');
  });

  it('handles multiple sup tags', () => {
    const result = linkFootnotes('text<sup>1</sup> more<sup>2</sup>', { '1': 'a', '2': 'b' });
    expect(result).toContain('href="#fn-1"');
    expect(result).toContain('href="#fn-2"');
  });

  it('does not match sup with attributes', () => {
    // Documents current limitation: regex only matches <sup>N</sup> exactly
    const result = linkFootnotes('<sup class="x">1</sup>', { '1': 'note' });
    expect(result).toBe('<sup class="x">1</sup>');
  });

  it('does not match non-numeric sup content', () => {
    const result = linkFootnotes('<sup>abc</sup>', { '1': 'note' });
    expect(result).toBe('<sup>abc</sup>');
  });
});
